/**
 * I18n composable — reactive translation state for Vue 3.
 *
 * Translations are bundled at build time (src/configs/i18n/translations.ts);
 * language switching is fully synchronous — no runtime fetch.
 */

import { inject, type Ref } from "vue";
import { TRANSLATIONS } from "../configs/i18n/translations";
import { DEFAULT_LANG } from "../configs/language-list";
import { normalizeLang, translateMessage } from "../core/i18n";
import { updatePageTitle } from "../platform/page-title";
import { getStoredLang, setStoredLang } from "../platform/storage";
import { I18N_LOCALE_KEY, I18N_MESSAGES_KEY } from "../plugins/i18n";
import type { Lang } from "../types/app";
import { AppEvent } from "../types/app";

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
   * Delegates to the shared pure translator in core/i18n.ts.
   *
   * @param key - i18n message key.
   * @param params - Optional array of strings to replace `%1`, `%2`,
   *   etc. placeholders (1-based).  Unmatched placeholders are
   *   left as-is; extra params are ignored.
   */
  function t(key: string, params?: string[]): string {
    return translateMessage(
      messages.value,
      TRANSLATIONS[DEFAULT_LANG],
      key,
      params,
    );
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

    // Apply language side-effects to the document
    document.documentElement.lang = lang;

    const url = new URL(window.location.href);
    url.searchParams.set("lang", lang);
    history.replaceState(null, "", url);

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
