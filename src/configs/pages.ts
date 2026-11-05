/**
 * Page inventory — the single source of truth for the site's page names.
 * Consumed by the HAST link classifier (internal vs static, via
 * `INTERNAL_PAGES`) and by build/site-meta (the `PAGE_META` completeness
 * check, which is keyed by this tuple).
 */

/** All full page names (without the .html extension). */
export const PAGE_NAMES = [
  "index",
  "about",
  "artworks-and-videos",
  "gallery",
  "blogs-and-sponsor",
  "chatting",
  "softwares",
  "copyright-notice",
] as const;

/**
 * Internal page paths — the SPA page set, as absolute paths.
 * Every other same-origin path (a sub-site directory, an asset) is not an
 * SPA route; see the `static` link type.
 */
export const INTERNAL_PAGES: readonly string[] = PAGE_NAMES.map(
  (name) => `/${name}.html`,
);
