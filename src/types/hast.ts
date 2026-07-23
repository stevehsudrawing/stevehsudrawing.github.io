/**
 * Shared hast (Hypertext Abstract Syntax Tree) types.
 * Used by link-cards-generator.ts and utils.ts.
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

/**
 * Link-card related types used by the link-cards generator.
 */

export interface CardData {
    available?: boolean;
    icon?: HastNode;
    title?: HastNode;
    description?: HastNode;
}

export interface GroupData {
    title?: HastNode;
    description?: HastNode;
    contents?: CardData[];
}
