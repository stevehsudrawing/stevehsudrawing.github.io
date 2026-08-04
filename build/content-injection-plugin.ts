/**
 * Vite plugin: pre-render page content at build time.
 *
 * NOTE: This plugin is now a no-op pass-through.  Link cards and
 * link button groups have been migrated to Vue components loaded
 * at runtime (Phase 7).  The plugin is retained as a hook point
 * in case future build-time content injection is needed.
 */

import { getPageName } from "./utils";
import { PAGE_META } from "./page-meta";
import type { IndexHtmlTransformContext } from "vite";

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin (no-op pass-through after Phase 7 migration).
 * Kept as a hook point for potential future build-time injection.
 * @returns A Vite plugin object with a transformIndexHtml hook.
 */
export function contentInjectionPlugin() {
  return {
    name: "content-injection-plugin",
    transformIndexHtml: {
      order: "pre" as const,
      handler(html: string, ctx: IndexHtmlTransformContext): string {
        const pageName = getPageName(ctx.filename);
        const meta = PAGE_META[pageName];
        if (!meta) return html;
        // No-op: all content is now rendered by Vue components at runtime
        return html;
      },
    },
  };
}
