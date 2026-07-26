/**
 * Internationalization (i18n) module.
 * Translates page text from JSON files, manages the language selector UI,
 * and persists the user's preference. The language list itself is
 * pre-rendered at build time by the content-injection-plugin.
 */

import type { Lang } from "../types/app.js";
import { StorageKey, AppEvent } from "../types/app.js";

export let currentLang: Lang = "en";
export let langData: Record<string, string> = {};

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
    return langData[key];
  }
  return fallback !== undefined ? fallback : "";
}

/**
 * Walk the DOM and replace text content of all [data-i18n] elements
 * using the currently loaded langData dictionary.
 * Dispatches a 'pageTextUpdated' event afterward so other modules
 * (e.g. tooltips) can react to the text change.
 */
export function updatePageText(): void {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = translate(key!);
    if (translated) {
      el.textContent = translated;
    } else {
      console.log("Missing key:", key);
    }
  });

  // Translate HTML-capable elements: [data-i18n-html] uses innerHTML
  // so the translation string may contain inline markup (e.g. <cite>).
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    const translated = translate(key!);
    if (translated) {
      el.innerHTML = translated;
    } else {
      console.log("Missing key:", key);
    }
  });

  // Translate img alt attributes: elements with data-i18n-alt
  // use it to specify the translation key,
  // and the translated text is written to the alt attribute.
  document.querySelectorAll("img[data-i18n-alt]").forEach((el) => {
    const key = el.getAttribute("data-i18n-alt");
    const translated = translate(key!);
    if (translated) {
      el.setAttribute("alt", translated);
    } else {
      console.log("Missing key:", key);
    }
  });

  // Translate aria-label attributes: elements with data-i18n-aria-label
  // use it to specify the translation key,
  // and the translated text is written to the aria-label attribute.
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    const translated = translate(key!);
    if (translated) {
      el.setAttribute("aria-label", translated);
    } else {
      console.log("Missing key:", key);
    }
  });

  // Notify other modules that page text has been updated
  document.dispatchEvent(new CustomEvent(AppEvent.PageTextUpdated));
}

/**
 * Highlight the active language item in the language switcher dropdown.
 */
export function setActiveLangItem(): void {
  try {
    const langItems = document.querySelectorAll(".lang-item");
    if (langItems.length === 0) {
      console.warn("Cannot find language items!");
      return;
    }

    langItems.forEach((item) => {
      const itemDataLang = item.getAttribute("data-lang");
      if (itemDataLang === currentLang) {
        item.classList.add("active");
        item.setAttribute("aria-current", "true");
      } else {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      }
    });
  } catch (error) {
    console.error("Failed to activate language item:", error);
  }
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
export function applyLangData(lang: Lang, data: Record<string, string>): void {
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

  setActiveLangItem();
  const languageSelect = document.getElementById(
    "language-select",
  ) as HTMLSelectElement | null;
  if (languageSelect) {
    languageSelect.value = currentLang;
  }
}
