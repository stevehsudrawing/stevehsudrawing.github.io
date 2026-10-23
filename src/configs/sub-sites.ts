/**
 * Sub-site links — same-origin destinations that live outside the SPA.
 *
 * Each sub-site is its own repository published under the same origin
 * (`/articles/` → the `articles` repo).  They are neither `external` (the
 * confirmation modal is pointless on one's own site) nor `internal` (the
 * SPA router does not own their routes), so links to them use the `static`
 * type and navigate as full page loads.
 *
 * `public/worldview.html` repeats these paths in an inline script — a static
 * file cannot import TS, so keep the two in sync.
 */

import type { Lang } from "../types/app";

/** Root of the articles sub-site. */
export const ARTICLES_SUB_SITE_ROOT = "/articles/index.html";

/** The character-story article, keyed by language (sub-site language folders are lowercase). */
export const ARTICLES_CHARACTER_STORY: Record<Lang, string> = {
  en: "/articles/en/2026-07-15-character-story/",
  "zh-Hans": "/articles/zh-hans/2026-07-15-character-story/",
  "zh-Hant": "/articles/zh-hant/2026-07-15-character-story/",
};
