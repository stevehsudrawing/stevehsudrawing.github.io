/**
 * Page navigation chain — defines the doubly-linked-list traversal order
 * for Previous/Next page navigation across the site.
 *
 * Pages not in the chain (e.g. index) serve as entry points and do not
 * receive nav links themselves.
 */

// =========================================================================
// Chain configuration
// =========================================================================

/**
 * Main bidirectional chain (linked-list order).
 * The first entry's Previous link points to CHAIN_ROOT.
 * The last entry has no Next link.
 */
const MAIN_CHAIN = [
  "artworks-and-videos",
  "softwares",
  "blogs-and-sponsor",
  "chatting",
  "about",
  "gallery",
] as const;

/** Landing page — linked back to by the first MAIN_CHAIN entry. */
const CHAIN_ROOT = "index";

/**
 * Leaf pages that link back to a single parent.
 * Key = page name, value = parent page name (without .html).
 */
const LEAVES: Record<string, string> = {
  "copyright-notice": "index",
  worldview: "about",
};

// =========================================================================
// Interface
// =========================================================================

/** Previous/Next page hrefs. Undefined means no link in that direction. */
export interface PageNavLinks {
  /** Href for the Previous-page link. */
  prev?: string;
  /** Href for the Next-page link. */
  next?: string;
}

// =========================================================================
// Lookup
// =========================================================================

/**
 * Resolve Previous/Next page hrefs for a given page name.
 * @param pageName - Page identifier (without .html extension),
 *   e.g. "softwares", "about", "copyright-notice".
 * @returns Previous/Next hrefs, or empty object if the page is not in
 *   the chain (e.g. index).
 */
export function getPageNavLinks(pageName: string): PageNavLinks {
  // Main bidirectional chain
  const idx = MAIN_CHAIN.indexOf(pageName as (typeof MAIN_CHAIN)[number]);
  if (idx !== -1) {
    return {
      prev: idx > 0 ? `/${MAIN_CHAIN[idx - 1]}.html` : `/${CHAIN_ROOT}.html`,
      next:
        idx < MAIN_CHAIN.length - 1
          ? `/${MAIN_CHAIN[idx + 1]}.html`
          : undefined,
    };
  }

  // Leaf pages
  const parent = LEAVES[pageName];
  if (parent) {
    return { prev: `/${parent}.html` };
  }

  return {};
}
