/**
 * Supported-language configuration — the single source of truth for the
 * language list and the language-keyed date-fns locales.
 * Consumed at runtime by AppNavbar / SettingsModal / GitHubEventsModal
 * and at build time by the sitemap and head-tags plugins.
 */

import type { Locale } from "date-fns";
import type { Lang } from "../types/app";
import { enUS, zhCN, zhTW } from "date-fns/locale";

/** One supported language: canonical code + display name. */
export interface LanguageEntry {
  /** Canonical language code (matches `Lang`). */
  code: Lang;
  /** Display name in the language itself (e.g. "English", "中文 (简体)"). */
  localizedName: string;
}

/** All supported languages, in display order. */
export const LANGUAGE_LIST: readonly LanguageEntry[] = [
  { code: "en", localizedName: "English" },
  { code: "zh-Hans", localizedName: "中文 (简体)" },
  { code: "zh-Hant", localizedName: "中文 (繁體)" },
];

// ---- date-fns locales ----

/** date-fns locales keyed by app language (relative-time formatting). */
export const DATE_LOCALES: Record<Lang, Locale> = {
  en: enUS,
  "zh-Hans": zhCN,
  "zh-Hant": zhTW,
};
