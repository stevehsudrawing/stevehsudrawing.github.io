/**
 * Build-time TypeScript type definitions.
 * Used by build scripts (link-cards, link-button-groups, plugins, etc.).
 */

/**
 * Internal HAST node alias.
 *
 * 'any' is used because hastscript and toHtml use specific literal types that
 * are incompatible with our JSON-derived generic Node interface. All node data
 * originates from validated JSON configs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Node = any;

import type { HastProperties } from "../src/types/hast.js";

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

/** Page tier classification that controls which entry script and head tags are used. */
export type PageTier = "full" | "none";

/** JSON-LD structured data format type for a page. */
export type JsonLDType = "homepage" | "breadcrumb" | "none";

/** Sitemap change frequency values per the sitemaps.org protocol. */
export type Changefreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

/** Metadata for a single page, used by the head-tags plugin for SEO tag generation. */
export interface PageMetaEntry {
  /** Page title (already includes site name suffix). */
  title: string;
  /** Meta description for SEO and social sharing. */
  description: string;
  /** URL path relative to site root (e.g. "/about.html", "/"). */
  pagePath: string;
  /** Robots meta value (e.g. "index, follow", "noindex"). */
  robots: string;
  /** Type of JSON-LD structured data to generate for this page. */
  jsonLDType: JsonLDType;
  /** Human-readable page name for breadcrumb JSON-LD (required when jsonLDType is 'breadcrumb'). */
  jsonLDPageName?: string;
  /** Page tier that controls which features and scripts are loaded. */
  tier: PageTier;
  /** Change frequency for sitemap.xml. Only needed for indexable pages. */
  changefreq?: Changefreq;
  /** Priority for sitemap.xml (0.0 to 1.0). Only needed for indexable pages. */
  priority?: number;
}

/** Map of page names to their metadata entries; the shape of PAGE_META in page-meta.ts. */
export interface PageMetaMap {
  [pageName: string]: PageMetaEntry;
}

// ---------------------------------------------------------------------------
// Link-card data (used by builders/link-cards.ts)
// ---------------------------------------------------------------------------

/** Link-card descriptor used by the link-cards builder. */
export interface CardData {
  /** When not true, the card gets an opacity-75 treatment. */
  available?: boolean;
  /** HAST `<img>` element for the card icon. */
  icon?: Node;
  /** HAST node (usually `<a>` or `<span>`) for the card title. */
  title?: Node;
  /** HAST root node for the card description text. */
  description?: Node;
}

/** Link-card group descriptor - a titled section containing multiple link cards. */
export interface GroupData {
  /** HAST node for the group title (rendered inside `<h2>`). */
  title?: Node;
  /** HAST root node for the group description (rendered inside `<p class="card-text">`). */
  description?: Node;
  /** Array of link cards within this group. */
  contents?: CardData[];
}

// ---------------------------------------------------------------------------
// Link-button-group data (used by builders/link-button-groups.ts)
// ---------------------------------------------------------------------------

/** Link-button descriptor used by the link-button-groups builder. */
export interface LinkButtonData {
  /** Whether the link points to an external site. */
  externalLink: boolean;
  /** Target URL for the button link. */
  linkHref: string;
  /** HAST-format properties for the button's icon `<img>`. */
  iconProps: HastProperties;
  /** When true, the button gets btn-primary styling with automatic colored image treatment. */
  primary?: boolean;
}

/** Link-button-group descriptor - a set of buttons identified by groupId for injection into a placeholder. */
export interface LinkButtonGroupData {
  /** Matches the data-group-id attribute on the injection placeholder. */
  groupId: string;
  /** Array of button definitions within this group. */
  buttons: LinkButtonData[];
}
