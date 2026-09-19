/**
 * Time formatting helpers — the shared relative / absolute localized
 * time strings (changelog rows, GitHub event rows).
 *
 * Relative time comes from date-fns (`formatDistanceToNow`, e.g.
 * "2 hours ago"); absolute time uses the per-language
 * `DATETIME_FORMATS` pattern.  Both read the language-keyed
 * configuration in `configs/language-list.ts` — callers pass the
 * CURRENT language, so a language switch re-renders the result.
 */

import { format, formatDistanceToNow } from "date-fns";
import { DATE_LOCALES, DATETIME_FORMATS } from "../configs/language-list";
import type { Lang } from "../types/app";

/**
 * Relative, human-readable time in the given language.
 *
 * @param iso - ISO 8601 timestamp.
 * @param lang - Current app language.
 * @returns e.g. "2 hours ago" / "2 小时前".
 */
export function formatRelativeTime(iso: string, lang: Lang): string {
  return formatDistanceToNow(new Date(iso), {
    addSuffix: true,
    locale: DATE_LOCALES[lang],
  });
}

/**
 * Absolute localized date-time in the given language.
 *
 * @param iso - ISO 8601 timestamp.
 * @param lang - Current app language.
 * @returns e.g. "2026年9月18日 22:07" / "Sep 18, 2026 22:07".
 */
export function formatAbsoluteTime(iso: string, lang: Lang): string {
  return format(new Date(iso), DATETIME_FORMATS[lang], {
    locale: DATE_LOCALES[lang],
  });
}
