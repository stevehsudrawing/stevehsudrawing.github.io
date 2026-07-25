/**
 * Build-time TypeScript type definitions.
 * Used by build scripts (link-cards, link-button-groups, plugins, etc.).
 */

// Internal HAST node alias: 'any' is used because hastscript and toHtml use
// specific literal types that are incompatible with our JSON-derived generic
// Node interface. All node data originates from validated JSON configs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Node = any;

import type { HastProperties } from '../src/types/hast.js';

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
// Link-card data (used by builders/link-cards.ts)
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

// ---------------------------------------------------------------------------
// Link-button-group data (used by builders/link-button-groups.ts)
// ---------------------------------------------------------------------------

export interface LinkButtonData {
    externalLink: boolean;
    linkHref: string;
    iconProps: HastProperties;
    primary?: boolean;
}

export interface LinkButtonGroupData {
    groupId: string;
    buttons: LinkButtonData[];
}
