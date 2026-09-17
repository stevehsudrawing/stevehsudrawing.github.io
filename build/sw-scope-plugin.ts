/**
 * Vite plugin: inject the README-derived glob list into the service
 * worker (`/sw.js`).
 *
 * `public/images/README.md` is the single source of truth for the
 * protected image paths (the section 1.1 / 1.2 tables).  Its backticked
 * path patterns are parsed here and injected into the
 * `@__SW_SCOPE_PATTERNS__` placeholder of `public/sw.js` - both in the
 * build output (`dist/sw.js`) and on the dev server (`/sw.js` is
 * intercepted and served transformed), so dev and production share one
 * behaviour.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { createBundleWrittenGate } from "./utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

/** sw.js placeholder replaced with the parsed pattern array. */
const PLACEHOLDER = "/* @__SW_SCOPE_PATTERNS__ */ []";

/** Minimum sane pattern count - guards against a README parse failure. */
const MIN_PATTERNS = 10;

/**
 * Extract the glob patterns of the two README tables (every table row
 * whose first cell is a single backticked token).
 *
 * @returns The path patterns, in table order.
 */
function readPatterns(): string[] {
  const markdown = readFileSync(
    resolve(ROOT, "public", "images", "README.md"),
    "utf-8",
  );
  const patterns: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\|\s*`([^`]+)`/);
    if (match) patterns.push(match[1]);
  }
  if (patterns.length < MIN_PATTERNS) {
    throw new Error(
      `sw-scope-plugin: parsed only ${patterns.length} patterns from public/images/README.md`,
    );
  }
  return patterns;
}

/**
 * Replace the sw.js placeholder with the parsed pattern array.
 *
 * @param source - The raw `public/sw.js` source.
 * @param patterns - Glob patterns to inject.
 * @returns The transformed source.
 */
function injectPatterns(source: string, patterns: string[]): string {
  if (!source.includes(PLACEHOLDER)) {
    throw new Error("sw-scope-plugin: placeholder not found in sw.js");
  }
  return source.replace(
    PLACEHOLDER,
    `/* @__SW_SCOPE_PATTERNS__ */ ${JSON.stringify(patterns)}`,
  );
}

/**
 * Vite plugin that injects the README-derived image-block glob list
 * into `sw.js` (build output + dev server).
 *
 * @returns A Vite plugin object (writeBundle-gated closeBundle +
 * configureServer hooks).
 */
export function swScopePlugin(): Plugin {
  const gate = createBundleWrittenGate();
  return {
    name: "sw-scope-plugin",
    writeBundle: gate.writeBundle,
    closeBundle(): void {
      if (!gate.isBundleWritten()) return;

      const swPath = resolve(ROOT, "dist", "sw.js");
      if (!existsSync(swPath)) return; // belt: public/sw.js missing
      writeFileSync(
        swPath,
        injectPatterns(readFileSync(swPath, "utf-8"), readPatterns()),
      );
    },
    configureServer(server): void {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        if (req.method !== "GET" || url !== "/sw.js") {
          next();
          return;
        }
        res.setHeader("Content-Type", "text/javascript; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.end(
          injectPatterns(
            readFileSync(resolve(ROOT, "public", "sw.js"), "utf-8"),
            readPatterns(),
          ),
        );
      });
    },
  };
}
