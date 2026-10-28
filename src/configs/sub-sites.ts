/**
 * Sub-site links — same-origin destinations that live outside the SPA.
 *
 * Each sub-site is its own repository published under the same origin
 * (`/articles/` → the `articles` repo).  They are neither `external` (the
 * confirmation modal is pointless on one's own site) nor `internal` (the
 * SPA router does not own their routes), so links to them use the `static`
 * type and navigate as full page loads.
 *
 * The sub-site builds with `base: "/articles"` and `trailingSlash: "always"`,
 * so its canonical URLs end in a slash — link the directory form.
 *
 * Three files cannot import this module and therefore repeat the root:
 * `public/worldview.html` (a static page), `configs/link-cards/
 * blogs-and-sponsor.json` and `configs/link-button-groups/index.json`
 * (data).  Keep them in step by hand.
 */

import type { Lang } from "../types/app.ts";

/** Root of the articles sub-site (directory form — the canonical URL). */
export const ARTICLES_SUB_SITE_ROOT = "/articles/";

/** The sub-site's agent-readable inventory (`llms.txt`). */
export const ARTICLES_SUB_SITE_LLMS_TXT = `${ARTICLES_SUB_SITE_ROOT}llms.txt`;

/** The sub-site's sitemap (declared by `public/robots.txt`). */
export const ARTICLES_SUB_SITE_SITEMAP = `${ARTICLES_SUB_SITE_ROOT}sitemap.xml`;

/** The character-story article, keyed by language (sub-site language folders are lowercase). */
export const ARTICLES_CHARACTER_STORY: Record<Lang, string> = {
  en: "/articles/en/2026-07-15-character-story/",
  "zh-Hans": "/articles/zh-hans/2026-07-15-character-story/",
  "zh-Hant": "/articles/zh-hant/2026-07-15-character-story/",
};
