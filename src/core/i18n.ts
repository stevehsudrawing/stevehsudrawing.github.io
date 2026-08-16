/**
 * Internationalization (i18n) pure logic — no DOM, no events.
 *
 * Translation CONTENT is bundled in src/configs/i18n/; language-switching
 * orchestration and document side-effects live in useI18n() (composables).
 * Both the plugin's `$t()` and the composable's `t()` delegate the shared
 * lookup/fallback/param-replacement logic to `translateMessage()` here.
 */

import type { Lang } from "../types/app";

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
 * Resolve an i18n key to translated text: active language first, then the
 * fallback messages (English), then replace `%1`, `%2`, ... placeholders.
 *
 * @param messages - Active language messages.
 * @param fallbackMessages - Fallback messages (English).
 * @param key - i18n message key.
 * @param params - Optional positional params for `%1`, `%2`, ... (1-based).
 *   Unmatched placeholders are left as-is; extra params are ignored.
 * @returns The translated string ('' when the key is missing everywhere).
 */
export function translateMessage(
  messages: Record<string, unknown>,
  fallbackMessages: Record<string, unknown>,
  key: string,
  params?: string[],
): string {
  const raw = messages[key] ?? fallbackMessages[key];
  let result: string = typeof raw === "string" ? raw : "";
  if (params && params.length > 0) {
    result = result.replace(
      /%(\d+)/g,
      (_m: string, n: string) => params[+n - 1] ?? _m,
    );
  }
  return result;
}
