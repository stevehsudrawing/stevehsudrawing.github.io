/**
 * I18n composable — reactive translation state for Vue 3.
 *
 * Provides locale, messages, translation function, and language-switching
 * orchestration.  Absorbs the logic previously in features/lang-switcher.ts
 * and the tooltip i18n listener from ui/tooltips.ts.
 *
 * Phase 7: eliminates window.__loadingBar bridge by exposing
 * isLanguageLoading ref for LoadingBar integration via watch in App.vue.
 */

import { ref, inject, type Ref } from "vue";
import { I18N_LOCALE_KEY, I18N_MESSAGES_KEY } from "../plugins/i18n";
import { SHOW_TOAST_KEY } from "../composables/useToast";
import { AppEvent, StorageKey } from "../types/app";
import type { Lang } from "../types/app";

/**
 * Reactive i18n composable.
 *
 * @returns locale ref, messages ref, t(), setLocale(),
 *          initLang(), and isLanguageLoading ref.
 */
export function useI18n(): {
  locale: Ref<Lang>;
  messages: Ref<Record<string, unknown>>;
  /** Translate a text key with optional fallback. */
  t: (key: string, fallback?: string) => string;
  /** Fetch the JSON file for a given language and apply it. */
  setLocale: (rawLang: string) => Promise<void>;
  /**
   * Determine the preferred language (URL param -> localStorage -> default)
   * and load it.  Call once during App.vue onMounted.
   */
  initLang: () => Promise<void>;
  /** True while a language file is being fetched. */
  isLanguageLoading: Ref<boolean>;
} {
  const locale = inject<Ref<Lang>>(I18N_LOCALE_KEY)!;
  const messages = inject<Ref<Record<string, unknown>>>(I18N_MESSAGES_KEY)!;
  const showToast = inject<
    ((type: "success" | "error", message: string) => void) | undefined
  >(SHOW_TOAST_KEY, undefined);

  /** Reactive flag for LoadingBar integration. */
  const isLanguageLoading = ref(false);

  // ---- Translation ----

  /**
   * Synchronous translation function for templates and script.
   *
   * @param key - i18n message key.
   * @param fallback - Default string if the key is not found.
   * @param params - Optional array of strings to replace `%1`, `%2`,
   *   etc. placeholders (1-based).  Unmatched placeholders are
   *   left as-is; extra params are ignored.
   */
  function t(key: string, fallback?: string, params?: string[]): string {
    const raw = messages.value[key];
    let result: string = typeof raw === "string" ? raw : (fallback ?? "");
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
   * Load a language file and update reactive state, DOM, Navbar,
   * page title, and tooltips.
   */
  async function setLocale(rawLang: string): Promise<void> {
    const { normalizeLang, applyLangData } = await import("../core/i18n");

    const lang: Lang = normalizeLang(rawLang);

    isLanguageLoading.value = true;

    try {
      const response = await fetch(`/configs/i18n/${lang}.json`);
      if (!response.ok)
        throw new Error(`Failed to load language file: ${lang}`);
      const data: Record<string, unknown> = await response.json();

      // Update reactive state
      locale.value = lang;
      messages.value = data;

      // Update DOM for existing data-i18n elements (backward compat)
      applyLangData(lang, data);

      // Update page title
      const { updatePageTitle } = await import("../ui/page-title");
      updatePageTitle();

      // Persist preference
      localStorage.setItem(StorageKey.Lang, lang);
    } catch (error) {
      const label = t("text-language-load-failed", "Failed to load language");
      showToast?.("error", `${label}: ${(error as Error).message}`);
      console.error(label, error);
    } finally {
      isLanguageLoading.value = false;
    }
  }

  /**
   * Determine the preferred language and load it.
   * Priority: ?lang= URL parameter -> localStorage -> default 'en'.
   */
  async function initLang(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get("lang");
    const savedLang = urlLang || localStorage.getItem(StorageKey.Lang) || "en";
    await setLocale(savedLang);

    // Listen for user-triggered language switches from UI components
    document.addEventListener(AppEvent.LangSwitchRequested, ((
      e: CustomEvent,
    ) => {
      const lang = e.detail?.lang;
      if (lang && typeof lang === "string") {
        void setLocale(lang);
      }
    }) as EventListener);
  }

  return {
    locale,
    messages,
    t,
    setLocale,
    initLang,
    isLanguageLoading,
  };
}
