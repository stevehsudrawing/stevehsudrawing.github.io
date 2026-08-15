/**
 * i18n Vue plugin.
 *
 * Registers reactive locale + messages state globally via provide/inject
 * and exposes a convenience `$t(key, params?)` method on every component
 * instance (mimicking vue-i18n's API for easier future migration).
 *
 * Translations are bundled at build time (src/configs/i18n); the initial
 * messages are the default language, so `$t` always falls back to the
 * English text without a per-call fallback string.
 */

import type { App } from "vue";
import { ref, type Ref } from "vue";
import type { Lang } from "../types/app";
import { DEFAULT_LANG } from "../configs/language-list";
import { TRANSLATIONS } from "../configs/i18n/translations";

/** Key used for provide/inject. */
export const I18N_LOCALE_KEY = Symbol("i18nLocale");

/** Key used for provide/inject. */
export const I18N_MESSAGES_KEY = Symbol("i18nMessages");

/**
 * Install the i18n plugin on a Vue app.
 *
 * Sets up reactive `locale` and `messages` refs and provides them
 * to the entire component tree.  Also registers `$t` as a global
 * property for use in templates: `{{ $t('text-welcome') }}`.
 */
export const i18nPlugin = {
  install(app: App): void {
    const locale = ref<Lang>(DEFAULT_LANG);
    const messages = ref<Record<string, unknown>>({
      ...TRANSLATIONS[DEFAULT_LANG],
    });

    app.provide(I18N_LOCALE_KEY, locale);
    app.provide(I18N_MESSAGES_KEY, messages);

    // Global template helper — mirrors vue-i18n's $t signature.
    // Only returns string values; HAST nodes use useI18n().h() instead.
    app.config.globalProperties.$t = (
      key: string,
      params?: string[],
    ): string => {
      const raw = messages.value[key] ?? TRANSLATIONS[DEFAULT_LANG][key];
      let result: string = typeof raw === "string" ? raw : "";
      if (params && params.length > 0) {
        result = result.replace(
          /%(\d+)/g,
          (_m: string, n: string) => params[+n - 1] ?? _m,
        );
      }
      return result;
    };
  },
};
