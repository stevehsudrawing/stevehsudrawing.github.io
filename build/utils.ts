/**
 * Shared build-time utilities.
 * Used by multiple build scripts (link-cards, minify-plugin, etc.).
 */

import { readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import type { PageName } from "../types";

// ---------------------------------------------------------------------------
// HAST utilities
// ---------------------------------------------------------------------------

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
export function getPageName(filename: string): PageName {
  return filename
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(".html", "") as PageName;
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
