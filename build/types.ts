/**
 * Build-time TypeScript type definitions.
 */

import type { PAGE_NAMES } from "../src/configs/pages";

/**
 * Internal HAST node alias.
 *
 * 'any' is used because hastscript and toHtml use specific literal types that
 * are incompatible with our JSON-derived generic Node interface. All node data
 * originates from validated JSON configs.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Node = any;

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

/** Page identifier (without .html extension), derived from configs/pages.ts. */
export type PageName = (typeof PAGE_NAMES)[number];

/** Map of page names to their metadata entries; the shape of PAGE_META in site-meta.ts. */
export type PageMetaMap = Record<PageName, PageMetaEntry>;
