/**
 * Build-time TypeScript type definitions.
 * Used by build scripts (link-cards-builder, plugins, etc.).
 */

// Internal HAST node alias: 'any' is used because hastscript and toHtml use
// specific literal types that are incompatible with our JSON-derived generic
// HastNode interface. All node data originates from validated JSON configs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

// ---------------------------------------------------------------------------
// Page metadata
// ---------------------------------------------------------------------------

export type PageTier = 'full' | 'lightweight' | 'none';

export type JsonLDType = 'homepage' | 'breadcrumb' | 'none';

export interface PageMetaEntry {
    title: string;
    description: string;
    pagePath: string;
    robots: string;
    jsonLDType: JsonLDType;
    jsonLDPageName?: string;
    tier: PageTier;
}

export interface PageMetaMap {
    [pageName: string]: PageMetaEntry;
}

// ---------------------------------------------------------------------------
// Link-card data (used by link-cards-builder.ts)
// ---------------------------------------------------------------------------

export interface CardData {
    available?: boolean;
    icon?: Node;
    title?: Node;
    description?: Node;
}

export interface GroupData {
    title?: Node;
    description?: Node;
    contents?: CardData[];
}
