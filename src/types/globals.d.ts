/**
 * Global type declarations for objects exposed on `window`.
 * These are set in `src/main.js` for legacy compatibility.
 *
 * NOTE: Some packages (html-to-image, html2canvas) do not ship their own
 * type declarations.  For those we declare minimal module stubs below.
 * The `hast-util-to-html` package ships its own types.
 */

import type * as BootstrapNS from "bootstrap";
import type { toHtml as ToHtmlFn } from "hast-util-to-html";

declare global {
  interface Window {
    bootstrap: typeof BootstrapNS;
    htmlToImage: Record<string, unknown>;
    html2canvas: (
      element: HTMLElement,
      options?: Record<string, unknown>,
    ) => Promise<HTMLCanvasElement>;
    toHtml: typeof ToHtmlFn;
    /** Bridge: Vue LoadingBar instance for legacy TS consumers. */
    __loadingBar?: {
      show: () => void;
      complete: () => void;
      hide: () => void;
    };
    /** Bridge: Vue ScrollHint instance for legacy TS consumers. */
    __scrollHint?: {
      createHint: (group: HTMLElement) => void;
      removeHint: (group: HTMLElement) => void;
      updateAllHints: () => void;
      initAllHints: () => void;
    };
    /** Bridge: Vue CopyProtectedImg instance for legacy TS consumers. */
    __noCopy?: {
      init: () => void;
    };
    /** Bridge: Vue AppNavbar instance for legacy TS consumers. */
    __navbar?: {
      setActiveNavItem: () => void;
      updateNavbarBrandText: () => void;
    };
  }
}

export {};
