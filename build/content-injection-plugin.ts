/**
 * Vite plugin: pre-render page content at build time.
 *
 * Uses HAST tree manipulation (fromHtml -> walk -> toHtml) rather than
 * regex-based HTML string replacement.
 */

import { fromHtml } from "hast-util-from-html";
import { toHtml } from "hast-util-to-html";
import { getPageName } from "./utils";
import { PAGE_META } from "./configs/page-meta";
import { buildLinkCardsHTML } from "./builders/link-cards";
import { buildLinkButtonGroupHTML } from "./builders/link-button-groups";
import type { IndexHtmlTransformContext } from "vite";
import type { Node } from "./types";

// =========================================================================
// HAST tree operations
// =========================================================================

/**
 * Walk a HAST tree and perform content injection operations in one pass.
 *
 * Handles: link-card injection into #links and link-button-group placeholder
 * replacement. Mutates the tree in place.
 * @param node - The root HAST node of the body content.
 * @param pageName - Page name (e.g. "index", "about") for resolving config paths.
 */
function processContentTree(node: Node, pageName: string): void {
  if (!node || typeof node !== "object") return;
  if (node.type !== "element" && node.type !== "root") return;

  // --- Replace #links container with pre-rendered link cards ---
  if (
    node.type === "element" &&
    node.properties &&
    (node.properties as Record<string, unknown>).id === "links"
  ) {
    const linksHTML = buildLinkCardsHTML(pageName);
    if (linksHTML) {
      const parsed = fromHtml(linksHTML, { fragment: true });
      node.children = parsed.children || [];
    }
  }

  // --- Replace link-button-group placeholders ---
  if (
    node.type === "element" &&
    node.properties &&
    (node.properties as Record<string, unknown>).dataRole ===
      "link-button-group"
  ) {
    const props = node.properties as Record<string, unknown>;
    const groupId = props.dataGroupId as string | undefined;
    if (groupId && node.children) {
      const groupHTML = buildLinkButtonGroupHTML(pageName, groupId);
      if (groupHTML) {
        const parsed = fromHtml(groupHTML, { fragment: true });
        node.children = parsed.children || [];
        delete props.dataRole;
        delete props.dataGroupId;
      }
    }
  }

  // Recurse into children
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      processContentTree(child, pageName);
    }
  }
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that pre-renders page content at build time.
 *
 * Replaces link-card and link-button-group placeholders with pre-rendered
 * HTML via HAST tree manipulation.
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

        // Extract body content - only the body goes through HAST round-trip
        const bodyMatch = html.match(
          /([\s\S]*<body[^>]*>)([\s\S]*)(<\/body\s*>[\s\S]*)/i,
        );
        if (!bodyMatch) return html;

        const beforeBody = bodyMatch[1];
        const bodyContent = bodyMatch[2];
        const afterBody = bodyMatch[3];

        const bodyTree = fromHtml(bodyContent, {
          fragment: true,
        }) as unknown as Node;
        processContentTree(bodyTree, pageName);
        const newBody = toHtml(bodyTree as Parameters<typeof toHtml>[0]);

        return beforeBody + newBody + afterBody;
      },
    },
  };
}
