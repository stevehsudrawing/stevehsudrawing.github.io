/**
 * Ambient module declarations for Vite ?raw imports.
 *
 * Must be a standalone script (no imports/exports) so TypeScript treats
 * it as an ambient module declaration rather than a module augmentation.
 *
 * This is separate from globals.d.ts because globals.d.ts needs to import
 * from hast-util-to-html (making it a module), and module-level
 * `declare module` blocks behave differently in Volar's ts-plugin.
 */

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}
