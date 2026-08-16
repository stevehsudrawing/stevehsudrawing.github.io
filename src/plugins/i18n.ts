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
import { translateMessage } from "../core/i18n";

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

    // Global template helper — delegates to the shared pure translator.
    // (Cannot call useI18n().t() here: plugins must not import composables,
    // and inject() only works inside component setup.)
    app.config.globalProperties.$t = (key: string, params?: string[]): string =>
      translateMessage(messages.value, TRANSLATIONS[DEFAULT_LANG], key, params);
  },
};
