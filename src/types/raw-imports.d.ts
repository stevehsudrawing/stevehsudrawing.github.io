/**
 * Ambient module declarations for Vite ?raw imports.
 *
 * Must be a standalone script (no imports/exports) so TypeScript treats
 * it as an ambient module declaration rather than a module augmentation.
 *
 * This is separate from globals.d.ts because module-level `declare module`
 * blocks behave differently from ambient ones in Volar's ts-plugin; two
 * scripts keep each file's declarations where that plugin expects them.
 */

declare module "*.md?raw" {
  const content: string;
  export default content;
}

declare module "*?raw" {
  const content: string;
  export default content;
}
