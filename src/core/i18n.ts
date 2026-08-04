/**
 * Internationalization (i18n) module.
 * Translates page text from JSON files, manages the language selector UI,
 * and persists the user's preference. The language list itself is
 * pre-rendered at build time by the content-injection-plugin.
 */

import type { Lang } from "../types/app";
import { StorageKey, AppEvent } from "../types/app";

export let currentLang: Lang = "en";
export let langData: Record<string, unknown> = {};

/**
 * Normalize a language code to one of the site's supported languages.
 * Maps regional variants (zh-TW, zh-HK, etc.) to their canonical form,
 * and falls back to 'en' for any unrecognized code.
 * @param lang - The raw language code (e.g. 'zh-TW', 'en-US').
 * @returns The normalized language code ('en', 'zh-Hans', or 'zh-Hant').
 */
export function normalizeLang(lang: string): Lang {
  if (!lang || typeof lang !== "string") return "en";
  const lower = lang.toLowerCase();

  // Traditional Chinese: zh-HK, zh-MO, zh-TW, zh-Hant, and any zh-Hant-*
  if (
    lower === "zh-hk" ||
    lower === "zh-mo" ||
    lower === "zh-tw" ||
    lower === "zh-hant" ||
    lower.indexOf("zh-hant-") === 0
  ) {
    return "zh-Hant";
  }

  // Simplified Chinese: zh-Hans, zh-CN, zh-SG, bare 'zh', and any zh-Hans-*
  if (
    lower === "zh-hans" ||
    lower === "zh-cn" ||
    lower === "zh-sg" ||
    lower === "zh" ||
    lower.indexOf("zh-hans-") === 0
  ) {
    return "zh-Hans";
  }

  // Any other zh-* variant not covered above: default to Simplified Chinese
  if (lower.indexOf("zh") === 0) {
    return "zh-Hans";
  }

  // English and any en-* variant
  if (lower === "en" || lower.indexOf("en-") === 0) {
    return "en";
  }

  // All other codes: fall back to English
  return "en";
}

/**
 * Safely retrieve a translated string from the global langData dictionary.
 * If langData is loaded and contains the given key, the translated value is returned;
 * otherwise the fallback text is returned.
 * @param key - The i18n key to look up (e.g. 'text-welcome').
 * @param fallback - Text to return when the key is not found.
 * @returns The translated text, or the fallback if unavailable.
 */
export function translate(key: string, fallback?: string): string {
  if (typeof langData !== "undefined" && langData[key]) {
    const v = langData[key];
    return typeof v === "string" ? v : (fallback ?? "");
  }
  return fallback !== undefined ? fallback : "";
}

/**
 * Walk the DOM and replace text content of all [data-i18n] elements
 * using the currently loaded langData dictionary.
 * Dispatches a 'pageTextUpdated' event afterward so other modules
 * (e.g. tooltips) can react to the text change.
 *
 * @deprecated All Vue-rendered content now uses $t() / resolveI18nInHtml().
 * The DOM walk is a no-op.  The event dispatch is retained for the
 * tooltip-i18n listener in useI18n.ts.
 */
export function updatePageText(): void {
  // Notify other modules that page text has been updated
  document.dispatchEvent(new CustomEvent(AppEvent.PageTextUpdated));
}

/**
 * Apply already-loaded translation data to the page.
 * Stores the data, updates all [data-i18n] text, persists the preference,
 * and syncs core UI elements (lang attribute, dropdown highlight, select).
 * Callers are responsible for fetching the JSON and for syncing
 * ui-layer elements (navbar active item, page title).
 * @param lang - The normalized language code.
 * @param data - The parsed translation JSON object.
 */
export function applyLangData(lang: Lang, data: Record<string, unknown>): void {
  langData = data;
  currentLang = lang;

  updatePageText();

  // Save preference
  localStorage.setItem(StorageKey.Lang, lang);
  // Update URL query parameter without reloading
  const url = new URL(window.location.href);
  url.searchParams.set("lang", lang);
  history.replaceState(null, "", url);
  // Update <html lang>
  document.documentElement.lang = lang;

  const languageSelect = document.getElementById(
    "language-select",
  ) as HTMLSelectElement | null;
  if (languageSelect) {
    languageSelect.value = currentLang;
  }
}
