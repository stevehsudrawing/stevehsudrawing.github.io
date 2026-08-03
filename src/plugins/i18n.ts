/**
 * i18n Vue plugin.
 *
 * Registers reactive locale + messages state globally via provide/inject
 * and exposes a convenience `$t(key, fallback?)` method on every component
 * instance (mimicking vue-i18n's API for easier future migration).
 *
 * Coexists with core/i18n.ts: the plugin holds reactive STATE;
 * core/i18n.ts still handles DOM manipulation (updatePageText, etc.)
 * for the existing data-i18n attribute system.
 */

import type { App } from "vue";
import { ref, type Ref } from "vue";
import type { Lang } from "../types/app";

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
    const locale = ref<Lang>("en");
    const messages = ref<Record<string, unknown>>({});

    app.provide(I18N_LOCALE_KEY, locale);
    app.provide(I18N_MESSAGES_KEY, messages);

    // Global template helper -- mirrors vue-i18n's $t signature.
    // Only returns string values; HAST nodes use useI18n().h() instead.
    app.config.globalProperties.$t = (
      key: string,
      fallback?: string,
    ): string => {
      const v = messages.value[key];
      return typeof v === "string" ? v : (fallback ?? "");
    };
  },
};
