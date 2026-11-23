/**
 * Shared hast (Hypertext Abstract Syntax Tree) types.
 * Used by the card and picture components, their renderer and src/configs/*.
 *
 * Link-card / link-button config types (LinkCardData, LinkCardGroupData,
 * LinkButtonData, …) live in src/types/app.ts and are shared by the Vue
 * components and the build-time builders.
 */

/**
 * A hast node - can be root, element, text, or comment.
 * The shape is deliberately loose: it describes JSON configs that several
 * modules build, read and render, not one library's output.
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
