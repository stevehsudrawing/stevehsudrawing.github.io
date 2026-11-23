/// <reference types="vite/client" />

/**
 * Global type declarations for objects exposed on `window`.
 * These are set in `src/main.ts` for legacy compatibility.
 *
 * NOTE: Some packages (html-to-image) do not ship their own type
 * declarations.  For those we declare minimal module stubs below.
 * This file declares no imports, so it stays a script rather than a
 * module and the declarations below apply at the global scope.
 */

interface Window {
  htmlToImage: Record<string, unknown>;
}
