/**
 * Vue module augmentation — global component properties.
 *
 * Declares types for custom properties registered on every component
 * instance via `app.config.globalProperties` in Vue plugins.
 *
 * The trailing `export {}` is required: without it TypeScript treats
 * this file as a script and `declare module 'vue'` would REPLACE the
 * built-in vue types rather than augmenting them.
 */

declare module "vue" {
  interface ComponentCustomProperties {
    /**
     * Translate an i18n key, optionally falling back to a default string.
     * `params` replaces `%1`, `%2`, etc. placeholders (1-based).
     * Registered by `src/plugins/i18n.ts` (i18nPlugin).
     */
    $t: (key: string, fallback?: string, params?: string[]) => string;
  }
}

export {};
