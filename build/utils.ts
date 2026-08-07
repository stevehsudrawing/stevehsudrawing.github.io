/**
 * Shared build-time utilities.
 * Used by multiple build scripts (link-cards, minify-plugin, etc.).
 */

import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

// ---------------------------------------------------------------------------
// HAST utilities
// ---------------------------------------------------------------------------

/**
 * Convert arbitrary text to a URL-safe dash-case slug.
 * @param text - The input string to slugify.
 * @returns A lowercase, dash-separated slug with special characters removed.
 */
import { toDashCase, extractPlainText } from "../src/core/utils";

export { toDashCase, extractPlainText };

/**
 * Recursively extract the first href from a HAST node tree (from an <a> element).
 * Returns null if no href is found.
 * @param node - A HAST node object.
 * @returns The first href string encountered, or null.
 */
export function extractHastHref(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;
  if (n.type === "element" && n.tagName === "a" && n.properties) {
    const props = n.properties as Record<string, unknown>;
    if (typeof props.href === "string") return props.href;
  }
  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      const href = extractHastHref(child);
      if (href) return href;
    }
  }
  return null;
}

/**
 * Deep-clone a HAST node via JSON round-trip.
 * @param node - The HAST node to clone.
 * @returns A deep copy of the node, independent of the original.
 */
export function cloneNode<T>(node: T): T {
  return JSON.parse(JSON.stringify(node)) as T;
}

/**
 * Extract the page name from a Vite ctx.filename (absolute path).
 * @param filename - The absolute file path from Vite's transform context.
 * @returns e.g. "index", "about"
 */
export function getPageName(filename: string): string {
  return filename.replace(/\\/g, "/").split("/").pop()!.replace(".html", "");
}

// ---------------------------------------------------------------------------
// Filesystem utilities
// ---------------------------------------------------------------------------

/**
 * Recursively collect file paths with the given extension(s).
 * @param dir - The root directory to walk.
 * @param extensions - Array of file extensions to match (e.g. ['.html', '.json']).
 * @returns Array of absolute file paths matching the given extensions.
 */
export function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  const list = readdirSync(dir);
  for (const name of list) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      results.push(...walkDir(full, extensions));
    } else if (extensions.includes(extname(name))) {
      results.push(full);
    }
  }
  return results;
}
