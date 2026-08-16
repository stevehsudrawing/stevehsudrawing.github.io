/**
 * Page inventory — the single source of truth for the site's page names.
 * Consumed by core/utils (transition whitelist), page-chain navigation,
 * and build/site-meta (SEO metadata completeness check).
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

/** Internal page paths that support page transitions. */
export const INTERNAL_PAGES: readonly string[] = PAGE_NAMES.map(
  (name) => `/${name}.html`,
);

/** Page paths excluded from the page transition system. */
export const EXCLUDED_PAGES = [
  "/404.html",
  "/error-javascript-disabled.html",
  "/error-unsupported-browser.html",
] as const;
