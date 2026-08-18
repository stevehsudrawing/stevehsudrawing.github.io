/**
 * Shared hast (Hypertext Abstract Syntax Tree) types.
 * Used by src/core/utils.ts and src/configs/*.
 *
 * Link-card / link-button config types (LinkCardData, LinkCardGroupData,
 * LinkButtonData, …) live in src/types/app.ts and are shared by the Vue
 * components and the build-time builders.
 */

/**
 * A hast node - can be root, element, text, or comment.
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
 * and arbitrary attribute values.
 */
export interface HastProperties {
  className?: string | string[];
  [key: string]: unknown;
}
