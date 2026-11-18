/**
 * Vite plugin: inject the site origin (`BASE_URL`) into the static public
 * files that have to carry it - the five error pages and `robots.txt`.
 *
 * Those files are plain HTML / text served by the edge and the service
 * worker, so they cannot import `src/configs/site-meta.ts`.  They carry a
 * `%SITE_ORIGIN%` placeholder instead, which this plugin resolves both in
 * the build output and on the dev server, so development and production
 * share one behaviour.  After the rewrite the build fails if the retired
 * origin survives anywhere in `dist/`, so a stale literal cannot slip
 * through.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";
import { BASE_URL } from "../src/configs/site-meta.ts";
import { createBundleWrittenGate, walkDir } from "./utils.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");
const DIST_DIR = resolve(ROOT, "dist");

/** Placeholder replaced with the site origin in the static public files. */
const PLACEHOLDER = "%SITE_ORIGIN%";

/** The retired origin; the build guard rejects any output that names it. */
const LEGACY_ORIGIN = "https://stevehsudrawing.github.io";

/** Static public files that carry the placeholder. */
const TARGETS = [
  "403.html",
  "404.html",
  "error-javascript-disabled.html",
  "error-offline.html",
  "error-unsupported-browser.html",
  "robots.txt",
] as const;

/** Text extensions scanned by the legacy-origin guard. */
const GUARD_EXTENSIONS = [".html", ".txt", ".xml", ".js", ".json", ".md"];

/**
 * Replace the origin placeholder in one file's source.
 *
 * @param source - The raw file content.
 * @param file - The file name, used in the error message.
 * @returns The transformed content.
 * @throws When the placeholder is absent - a missed edit or a rename.
 */
function injectOrigin(source: string, file: string): string {
  if (!source.includes(PLACEHOLDER)) {
    throw new Error(
      `domain-injection-plugin: placeholder not found in ${file}`,
    );
  }
  return source.replaceAll(PLACEHOLDER, BASE_URL);
}

/**
 * Pick the response content type for a public file served in dev.
 *
 * @param file - The public file name.
 * @returns The value for the `Content-Type` header.
 */
function contentType(file: string): string {
  return file.endsWith(".html")
    ? "text/html; charset=utf-8"
    : "text/plain; charset=utf-8";
}

/**
 * Read a placeholder-carrying file from `public/`.
 *
 * @param file - The public file name.
 * @returns The raw file content.
 */
function readPublic(file: string): string {
  return readFileSync(resolve(PUBLIC_DIR, file), "utf-8");
}

/**
 * Fail the build when any text artifact in `dist/` still names the retired
 * origin.  The scheme is part of the needle so the GitHub repository URL
 * (`github.com/stevehsudrawing/stevehsudrawing.github.io`) does not match.
 *
 * @throws When a scanned file contains the retired origin.
 */
function assertNoLegacyOrigin(): void {
  for (const file of walkDir(DIST_DIR, GUARD_EXTENSIONS)) {
    if (readFileSync(file, "utf-8").includes(LEGACY_ORIGIN)) {
      throw new Error(
        `domain-injection-plugin: legacy origin found in ${relative(ROOT, file)}`,
      );
    }
  }
}

/**
 * Vite plugin that injects the site origin into the static public files
 * (build output + dev server) and guards the build against the retired
 * origin.
 *
 * @returns A Vite plugin object (writeBundle-gated closeBundle +
 * configureServer hooks).
 */
export function domainInjectionPlugin(): Plugin {
  const gate = createBundleWrittenGate();
  return {
    name: "domain-injection-plugin",
    writeBundle: gate.writeBundle,
    closeBundle(): void {
      if (!gate.isBundleWritten()) return;

      for (const target of TARGETS) {
        const distFile = resolve(DIST_DIR, target);
        if (!existsSync(distFile)) {
          throw new Error(`domain-injection-plugin: dist/${target} is missing`);
        }
        writeFileSync(
          distFile,
          injectOrigin(readFileSync(distFile, "utf-8"), target),
        );
      }
      assertNoLegacyOrigin();
    },
    configureServer(server): void {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const target = TARGETS.find((file) => url === `/${file}`);
        const method = req.method ?? "";
        if (!target || (method !== "GET" && method !== "HEAD")) {
          next();
          return;
        }
        res.setHeader("Content-Type", contentType(target));
        res.setHeader("Cache-Control", "no-cache");
        if (method === "HEAD") {
          res.end();
          return;
        }
        res.end(injectOrigin(readPublic(target), target));
      });
    },
  };
}
