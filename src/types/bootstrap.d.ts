/**
 * Ambient module declaration for bootstrap.
 *
 * Bootstrap 5's own types do not support the `import * as bootstrap`
 * pattern used in main.ts.  This file provides minimal type declarations.
 *
 * Must be a standalone script (no imports/exports) so TypeScript treats
 * it as an ambient module declaration rather than a module augmentation.
 */

declare module "bootstrap" {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  export const Tooltip: {
    getInstance: (el: Element) => {
      dispose: () => void;
      setContent: (content: Record<string, string>) => void;
    } | null;
    new (
      el: Element,
      options?: Record<string, unknown>,
    ): {
      dispose: () => void;
      setContent: (content: Record<string, string>) => void;
    };
  };

  export const Offcanvas: {
    getInstance: (el: Element) => { hide: () => void } | null;
    new (el: Element, options?: Record<string, unknown>): { hide: () => void };
  };
}
