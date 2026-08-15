/**
 * I18n composable — reactive translation state for Vue 3.
 *
 * Translations are bundled at build time (src/configs/i18n/translations.ts);
 * language switching is fully synchronous — no runtime fetch.
 */

import { inject, type Ref } from "vue";
import { I18N_LOCALE_KEY, I18N_MESSAGES_KEY } from "../plugins/i18n";
import { AppEvent } from "../types/app";
import type { Lang } from "../types/app";
import { getStoredLang, setStoredLang } from "../platform/storage";
import { DEFAULT_LANG } from "../configs/language-list";
import { TRANSLATIONS } from "../configs/i18n/translations";
import { normalizeLang, applyLangData } from "../core/i18n";
import { updatePageTitle } from "../platform/page-title";

/**
 * Reactive i18n composable.
 *
 * @returns locale ref, messages ref, t(), setLocale(), and initLang().
 */
export function useI18n(): {
  locale: Ref<Lang>;
  messages: Ref<Record<string, unknown>>;
  /** Translate a text key (falls back to the bundled English text). */
  t: (key: string, param?: string[]) => string;
  /** Switch the active language (synchronous, no fetch). */
  setLocale: (rawLang: string) => void;
  /**
   * Determine the preferred language (URL param -> storage -> default)
   * and apply it.  Call once during App.vue onMounted.
   */
  initLang: () => void;
} {
  const locale = inject<Ref<Lang>>(I18N_LOCALE_KEY)!;
  const messages = inject<Ref<Record<string, unknown>>>(I18N_MESSAGES_KEY)!;

  // ---- Translation ----

  /**
   * Synchronous translation function for templates and script.
   *
   * @param key - i18n message key.
   * @param params - Optional array of strings to replace `%1`, `%2`,
   *   etc. placeholders (1-based).  Unmatched placeholders are
   *   left as-is; extra params are ignored.
   */
  function t(key: string, params?: string[]): string {
    const raw = messages.value[key] ?? TRANSLATIONS[DEFAULT_LANG][key];
    let result: string = typeof raw === "string" ? raw : "";
    if (params && params.length > 0) {
      result = result.replace(
        /%(\d+)/g,
        (_m: string, n: string) => params[+n - 1] ?? _m,
      );
    }
    return result;
  }

  // ---- Language switching ----

  /**
   * Switch the active language: update reactive state, DOM, page title,
   * and the stored preference.
   */
  function setLocale(rawLang: string): void {
    const lang: Lang = normalizeLang(rawLang);
    const data = TRANSLATIONS[lang];

    // Update reactive state
    locale.value = lang;
    messages.value = data;

    // Update DOM for existing data-i18n elements (backward compat)
    applyLangData(lang, data);

    // Update page title
    updatePageTitle(t);

    // Persist preference
    setStoredLang(lang);
  }

  /**
   * Determine the preferred language (URL param -> storage -> default)
   * and apply it.  Also listens for language-switch requests from UI.
   */
  function initLang(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    setLocale(urlLang || getStoredLang());

    // Listen for user-triggered language switches from UI components
    document.addEventListener(AppEvent.LangSwitchRequested, ((
      e: CustomEvent,
    ) => {
      const lang = e.detail?.lang;
      if (lang && typeof lang === "string") {
        setLocale(lang);
      }
    }) as EventListener);
  }

  return {
    locale,
    messages,
    t,
    setLocale,
    initLang,
  };
}
