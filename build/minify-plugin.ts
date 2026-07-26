/**
 * Vite plugin: minify static assets after build.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { minify } from "html-minifier-terser";
import { walkDir } from "./utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// =========================================================================
// Minifiers
// =========================================================================

/**
 * Minify an HTML file using html-minifier-terser.
 * Preserves JSON-LD and noscript content via ignoreCustomFragments.
 * @param filePath - Absolute path to the HTML file (read and overwritten in place).
 */
async function minifyHTML(filePath: string): Promise<void> {
  const original = readFileSync(filePath, "utf-8");
  const result = await minify(original, {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    minifyCSS: true,
    minifyJS: true,
    ignoreCustomFragments: [
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      /<noscript>[\s\S]*?<\/noscript>/,
    ],
  });
  writeFileSync(filePath, result);
}

/** Minify a JSON file by re-serializing with JSON.stringify (no whitespace). */
function minifyJSON(filePath: string): void {
  const original = readFileSync(filePath, "utf-8");
  const compact = JSON.stringify(JSON.parse(original));
  writeFileSync(filePath, compact);
}

/** Minify legacy CSS files by removing comments and collapsing whitespace. */
function minifyStaticCSS(filePath: string): void {
  const original = readFileSync(filePath, "utf-8");
  const result = original
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/;[ \t]+/g, ";")
    .replace(/[ \t]*\{[ \t]*/g, "{")
    .replace(/\}[ \t]*\n/g, "}\n")
    .trim();
  writeFileSync(filePath, result);
}

/** Minify legacy JS files by removing line comments, block comments, and blank lines. */
function minifyStaticJS(filePath: string): void {
  const original = readFileSync(filePath, "utf-8");
  const result = original
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  writeFileSync(filePath, result);
}

/** Minify an XML file by removing whitespace between tags. */
function minifyXML(filePath: string): void {
  const original = readFileSync(filePath, "utf-8");
  const result = original.replace(/>\s+</g, "><").replace(/^\s+/, "").trim();
  writeFileSync(filePath, result);
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that minifies static assets after build.
 *
 * Minifies HTML (collapseWhitespace, removeComments via html-minifier-terser),
 * JSON (compact via JSON.stringify), legacy CSS/JS (comment removal, whitespace
 * collapse), and XML (whitespace between tags).
 * @returns A Vite plugin object with a closeBundle hook.
 */
export function minifyPlugin() {
  return {
    name: "minify-plugin",
    async closeBundle(): Promise<void> {
      const distDir = resolve(__dirname, "..", "dist");

      const htmlFiles = walkDir(distDir, [".html"]);
      for (const f of htmlFiles) await minifyHTML(f);

      const jsonFiles = walkDir(distDir, [".json"]);
      for (const f of jsonFiles) minifyJSON(f);

      const cssFiles = walkDir(distDir, [".css"]).filter((f) =>
        f.includes("legacy"),
      );
      for (const f of cssFiles) minifyStaticCSS(f);

      const jsFiles = walkDir(distDir, [".js"]).filter((f) =>
        f.includes("legacy"),
      );
      for (const f of jsFiles) minifyStaticJS(f);

      const xmlFiles = walkDir(distDir, [".xml"]);
      for (const f of xmlFiles) minifyXML(f);
    },
  };
}
