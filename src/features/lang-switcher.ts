/**
 * Language switching orchestrator.
 * Coordinates the i18n core with UI components (loading bar, toast, navbar, page title)
 * to provide a polished language-switching experience.
 */

import type { Lang } from "../types/app.js";
import { AppEvent, StorageKey } from "../types/app.js";
import { normalizeLang, applyLangData } from "../core/i18n.js";
import {
  showLoadingBar,
  completeLoadingBar,
  hideLoadingBar,
} from "../ui/loading-bar.js";
import { showToast } from "../ui/toast.js";

/**
 * Determine and load the preferred language.
 * Priority: ?lang= URL parameter → localStorage → default 'en'.
 */
export async function initLang(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const urlLang = urlParams.get("lang");
  const savedLang = urlLang || localStorage.getItem(StorageKey.Lang) || "en";
  await switchLang(savedLang);

  // Listen for user-triggered language switches from UI components
  document.addEventListener(AppEvent.LangSwitchRequested, ((e: CustomEvent) => {
    const lang = e.detail?.lang;
    if (lang && typeof lang === "string") {
      switchLang(lang);
    }
  }) as EventListener);
}

/**
 * Switch the page to the given language.
 * Shows a progress bar while loading, then syncs all UI elements.
 * On failure, hides the bar and shows an error toast.
 * @param rawLang - The raw language code (e.g. 'zh-TW', 'en-US').
 */
export async function switchLang(rawLang: string): Promise<void> {
  const lang: Lang = normalizeLang(rawLang);

  showLoadingBar();

  try {
    const response = await fetch(`/configs/i18n/${lang}.json`);
    if (!response.ok) throw new Error(`Failed to load language file: ${lang}`);
    const data: Record<string, string> = await response.json();

    // Apply the language data to the page (core i18n mechanics)
    applyLangData(lang, data);

    // Sync UI elements that depend on ui/ modules
    const { setActiveNavItem } = await import("../ui/navbar.js");
    setActiveNavItem();

    const { updatePageTitle } = await import("../ui/page-title.js");
    updatePageTitle();

    completeLoadingBar();
  } catch (error) {
    hideLoadingBar();
    const message = error instanceof Error ? error.message : "Unknown error";
    showToast("error", `Language loading failed: ${message}`);
    console.error("Failed to load language file:", error);
  }
}
