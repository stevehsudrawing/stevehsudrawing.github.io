/**
 * Supported-language configuration — the single source of truth for the
 * language list, the language-keyed date-fns locales, and the
 * language-keyed short/long date formats.
 * Consumed at runtime by AppNavbar / SettingsModal / GitHubEventsModal /
 * GitHubActivityStatsCard and at build time by the sitemap and head-tags
 * plugins.
 */

import type { Locale } from "date-fns";
import { enUS, zhCN, zhTW } from "date-fns/locale";
import type { Lang } from "../types/app.ts";

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

/** Default language used when no preference is stored. */
export const DEFAULT_LANG: Lang = "en";

// ---- date-fns locales ----

/** date-fns locales keyed by app language (relative-time formatting). */
export const DATE_LOCALES: Record<Lang, Locale> = {
  en: enUS,
  "zh-Hans": zhCN,
  "zh-Hant": zhTW,
};

// ---- date-fns format strings ----

/**
 * Short human-readable date per language — compact, no year (chart
 * ticks and similar tight spots).  zh uses the native "M月d日": the
 * locale default (`MMM d`) renders "8月 20" — awkward spacing and no
 * 日 — when formatted through the zh locales (v3.18.3 evaluation,
 * 2026-09-18).
 */
export const SHORT_DATE_FORMATS: Record<Lang, string> = {
  en: "MMM d",
  "zh-Hans": "M月d日",
  "zh-Hant": "M月d日",
};

/**
 * Long human-readable date per language — with year (tooltips and
 * similar).  Explicit because both the date-fns zh "PP" token (an ISO
 * "2026-09-12") and the merged date-adapter default
 * (`MMM d, yyyy, h:mm:ss aaaa` — a meaningless time part for
 * day-granular data) fall short (v3.18.3 evaluation, 2026-09-18).
 */
export const LONG_DATE_FORMATS: Record<Lang, string> = {
  en: "MMM d, yyyy",
  "zh-Hans": "yyyy年M月d日",
  "zh-Hant": "yyyy年M月d日",
};
