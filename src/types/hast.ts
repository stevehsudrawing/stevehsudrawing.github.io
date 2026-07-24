/**
 * Shared hast (Hypertext Abstract Syntax Tree) types.
 * Used by src/core/utils.ts and src/features/qr-code.ts.
 *
 * Link-card types (CardData, GroupData) have been moved to build/types.ts
 * since they are only used at build time.
 */

/**
 * A hast node — can be root, element, text, or comment.
 * The `hast-util-to-html` library uses a more precise union type;
 * this is a simplified version for our JSON configs.
 */
export interface HastNode {
    type: string;
    value?: string;
    tagName?: string;
    properties?: HastProperties;
    children?: HastNode[];
}

/**
 * Properties object for hast-style element attribute setting.
 * Supports className (string or string[]), camelCase data* keys
 * (converted to data-* kebab-case by setElementAttributes),
 * and arbitrary attribute values.
 */
export interface HastProperties {
    className?: string | string[];
    [key: string]: unknown;
}
