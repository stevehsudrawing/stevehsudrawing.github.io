/**
 * Bundled translations — the single source of truth for i18n messages.
 * All language files are statically imported at build time; switching
 * languages swaps the messages reference without any runtime fetch.
 */

import type { Lang } from "../../types/app";
import en from "./en.json";
import zhHans from "./zh-Hans.json";
import zhHant from "./zh-Hant.json";

/** All translations keyed by language code. */
export const TRANSLATIONS: Record<Lang, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  "zh-Hans": zhHans as Record<string, unknown>,
  "zh-Hant": zhHant as Record<string, unknown>,
};
