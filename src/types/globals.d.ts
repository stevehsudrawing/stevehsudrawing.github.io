/// <reference types="vite/client" />

/**
 * Global type declarations for objects exposed on `window`.
 * These are set in `src/main.ts` for legacy compatibility.
 *
 * NOTE: Some packages (html-to-image) do not ship their own type
 * declarations.  For those we declare minimal module stubs below.
 * The `hast-util-to-html` package ships its own types.
 */

import type { toHtml as ToHtmlFn } from "hast-util-to-html";

declare global {
  interface Window {
    htmlToImage: Record<string, unknown>;
    toHtml: typeof ToHtmlFn;
  }
}

export {};
