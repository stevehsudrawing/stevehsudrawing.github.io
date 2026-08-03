/**
 * Vite plugin: generate sitemap.xml at build time from PAGE_META config.
 *
 * Only pages with `robots: "index, follow"` (and the required sitemap
 * fields `changefreq` and `priority`) are included. The `lastmod` date is
 * always set to the build date (today), never read from config.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Plugin, ResolvedConfig } from "vite";
import { PAGE_META, BASE_URL } from "./configs/page-meta";
import type { PageMetaEntry } from "./types";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Supported language codes derived from language-list.json. */
interface LanguageEntry {
  code: string;
  localizedName: string;
}

/**
 * Load the language list from the JSON config file.
 * @returns Array of language entries with `code` and `localizedName`.
 */
function loadLanguageList(): LanguageEntry[] {
  const jsonPath = resolve(__dirname, "configs", "language-list.json");
  const raw = readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as LanguageEntry[];
}

/**
 * Generate a single `<url>` block for the sitemap, including hreflang
 * alternate links for all supported languages plus x-default.
 * @param meta - Page metadata entry from PAGE_META.
 * @param languages - Supported language list.
 * @param lastmod - Today's date in YYYY-MM-DD format.
 * @returns Indented XML string for this `<url>` entry.
 */
function generateUrlEntry(
  meta: PageMetaEntry,
  languages: LanguageEntry[],
  lastmod: string,
): string {
  const loc = `${BASE_URL}${meta.pagePath}`;
  const lines: string[] = [];
  lines.push("<url>");
  lines.push(`<loc>${loc}</loc>`);

  // Hreflang alternates
  for (const lang of languages) {
    lines.push(
      `<xhtml:link rel="alternate" hreflang="${lang.code}" href="${loc}?lang=${lang.code}"/>`,
    );
  }
  lines.push(
    `<xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>`,
  );

  // Standard sitemap fields
  lines.push(`<lastmod>${lastmod}</lastmod>`);
  lines.push(`<changefreq>${meta.changefreq}</changefreq>`);
  lines.push(`<priority>${meta.priority!.toFixed(1)}</priority>`);
  lines.push("</url>");
  return lines.join("\n");
}

/**
 * Determine whether a page should appear in the sitemap.
 * Only indexable pages with both `changefreq` and `priority` set are included.
 * @param meta - Page metadata entry.
 * @returns `true` if the page should be listed in the sitemap.
 */
function isIndexable(meta: PageMetaEntry): boolean {
  return (
    meta.robots.includes("index") &&
    !meta.robots.includes("noindex") &&
    meta.changefreq !== undefined &&
    meta.priority !== undefined
  );
}

/**
 * Generate the complete sitemap.xml content.
 * @param lastmod - Today's date in YYYY-MM-DD format.
 * @returns Full XML string for sitemap.xml.
 */
function generateSitemap(lastmod: string): string {
  const languages = loadLanguageList();
  const indexablePages = Object.values(PAGE_META).filter(isIndexable);

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  );

  for (const meta of indexablePages) {
    lines.push(generateUrlEntry(meta, languages, lastmod));
  }

  lines.push("</urlset>");
  return lines.join("\n") + "\n";
}

/**
 * Vite plugin that generates `sitemap.xml` in the output directory after
 * the bundle is written. `lastmod` is always set to the current date.
 * @returns A Vite Plugin object.
 */
export function sitemapPlugin(): Plugin {
  let outDir = "";

  return {
    name: "sitemap-plugin",

    configResolved(config: ResolvedConfig): void {
      outDir = config.build.outDir;
    },

    writeBundle(): void {
      const today = new Date().toISOString().slice(0, 10);
      const xml = generateSitemap(today);
      const outputPath = resolve(outDir, "sitemap.xml");
      writeFileSync(outputPath, xml, "utf-8");
      console.log(`[sitemap-plugin] Generated sitemap.xml (lastmod: ${today})`);
    },
  };
}
