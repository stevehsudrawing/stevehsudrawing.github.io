/**
 * I18n composable -- reactive translation state for Vue 3.
 *
 * Provides locale, messages, and a translation function.  Delegates
 * DOM updates (querySelectorAll walks for [data-i18n]) to core/i18n.ts
 * for backward compatibility until all templates are Vue SFCs.
 */

import { inject, type Ref } from "vue";
import { I18N_LOCALE_KEY, I18N_MESSAGES_KEY } from "../plugins/i18n.js";
import { SHOW_TOAST_KEY } from "../composables/useToast.js";
import type { Lang } from "../types/app.js";

/**
 * Reactive i18n composable.
 *
 * @returns locale ref, messages ref, t() translation function, and setLocale().
 */
export function useI18n(): {
  locale: Ref<Lang>;
  messages: Ref<Record<string, unknown>>;
  /** Translate a text key with optional fallback. */
  t: (key: string, fallback?: string) => string;
  /** Fetch the JSON file for a given language and apply it. */
  setLocale: (rawLang: string) => Promise<void>;
  /** Sync the Vue messages ref from legacy core/i18n.ts langData. */
  syncFromLangData: () => Promise<void>;
} {
  const locale = inject<Ref<Lang>>(I18N_LOCALE_KEY)!;
  const messages = inject<Ref<Record<string, unknown>>>(I18N_MESSAGES_KEY)!;
  const showToast = inject<
    ((type: "success" | "error", message: string) => void) | undefined
  >(SHOW_TOAST_KEY, undefined);

  /** Synchronous translation function for templates and script. */
  function t(key: string, fallback?: string): string {
    const v = messages.value[key];
    return typeof v === "string" ? v : (fallback ?? "");
  }

  /**
   * Load a language file and update the reactive messages ref.
   * Shows the loading bar during fetch, and a toast on error.
   * Also delegates to core/i18n.ts to apply DOM updates for existing
   * data-i18n elements.
   */
  async function setLocale(rawLang: string): Promise<void> {
    const { normalizeLang, applyLangData } = await import("../core/i18n.js");

    const lang: Lang = normalizeLang(rawLang);

    // Show loading bar (may not be ready during initial bootstrap)
    const bar = window.__loadingBar;
    bar?.show();

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

      bar?.complete();
    } catch (error) {
      bar?.hide();
      const label =
        typeof t === "function"
          ? t("text-language-load-failed", "Failed to load language")
          : "Failed to load language";
      showToast?.("error", `${label}: ${(error as Error).message}`);
      console.error(label, error);
    }
  }

  /**
   * Sync the Vue plugin's `messages` ref from the legacy `langData`
   * global in core/i18n.ts.  Necessary after `initLang()` (which calls
   * `applyLangData` directly without going through `setLocale`).
   */
  async function syncFromLangData(): Promise<void> {
    const { langData, currentLang } = await import("../core/i18n.js");
    locale.value = currentLang;
    messages.value = { ...langData };
  }

  return { locale, messages, t, setLocale, syncFromLangData };
}
