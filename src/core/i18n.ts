/**
 * Internationalization (i18n) module.
 * Translates page text from JSON files, manages the language selector UI,
 * and persists the user's preference. The language list itself is
 * pre-rendered at build time by the content-injection-plugin.
 */

import type { Lang } from "../types/app";
import { StorageKey } from "../types/app";

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
 * Apply already-loaded translation data to the page.
 * Stores the data, persists the preference, updates the URL query
 * parameter, the <html lang> attribute, and the language-select dropdown.
 * Callers are responsible for fetching the JSON and for syncing
 * ui-layer elements (page title).
 * @param lang - The normalized language code.
 * @param data - The parsed translation JSON object.
 */
export function applyLangData(lang: Lang, data: Record<string, unknown>): void {
  langData = data;
  currentLang = lang;

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
