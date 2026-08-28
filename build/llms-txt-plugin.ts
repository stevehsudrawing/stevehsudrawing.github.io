/**
 * Vite plugin: generate `llms.txt` + clean markdown page versions at build
 * time.
 *
 * Follows the llms.txt v2 spec (https://llmstxt.org/index.md):
 * - `dist/llms.txt` — a curated overview generated from `PAGE_META` (the
 *   page list stays in sync automatically) plus a hand-written intro
 *   template.
 * - `dist/<page>.html.md` — a clean markdown snapshot of every full page at
 *   the same URL with `.md` appended, for LLM/agent consumption.
 *
 * Generated markdown is exempt from the 80-column wrap rule (it is a build
 * output consumed by LLMs/agents, not hand-edited docs).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { PAGE_META } from "./site-meta";
import { BASE_URL, SITE_NAME } from "../src/configs/site-meta";
import { extractPlainText } from "../src/core/utils";
import {
  loadLinkCardGroups,
  loadLinkButtonGroups,
  loadPictureGroups,
  textFor,
  type LinkCardGroup,
  type LinkButtonGroup,
  type DisplayPictureGroup,
} from "./content-extract";
import type { PageMetaEntry } from "./types";

// =========================================================================
// Markdown naming
// =========================================================================

/**
 * Markdown file name for a page: append `.md` to the HTML file name
 * (e.g. "index.html.md", "about.html.md").
 * @param pageName - Page name (e.g. "about").
 * @returns The markdown snapshot file name.
 */
function markdownFileName(pageName: string): string {
  return `${pageName}.html.md`;
}

// =========================================================================
// Root llms.txt
// =========================================================================

/** Hand-written intro prose for the generated llms.txt (H1 + summary). */
const LLMS_TXT_INTRO = `# ${SITE_NAME}

> Personal multi-language link-hub consolidating profiles across creative,
> social, and development platforms. Built with TypeScript + Vite, deployed on
> GitHub Pages. Supports English, Simplified Chinese (zh-Hans), and Traditional
> Chinese (zh-Hant).

Each page has a clean markdown version at the same URL with \`.md\` appended
(e.g. \`/about.html.md\`), announced via \`rel="alternate" type="text/markdown"\`.`;

/** Static Project / Optional sections for the generated llms.txt. */
const LLMS_TXT_STATIC_SECTIONS = `## Project

- [Source Code](https://github.com/stevehsudrawing/stevehsudrawing.github.io): GitHub repository.
- [Image Copyright](${BASE_URL}/images/README.md): Artwork copyright notice and usage restrictions. See also [/images/llms.txt](${BASE_URL}/images/llms.txt) for the agent-readable summary.
- [Sitemap](${BASE_URL}/sitemap.xml): Full site structure for crawlers.

## Optional

- Original artworks under \`/images/\` are copyright-protected and blocked from
  AI/ML crawlers via \`/robots.txt\`; see \`/images/llms.txt\`.
- [llms.txt specification](https://llmstxt.org/index.md): The format this file follows.`;

/**
 * Display name for a page in the llms.txt Core Pages list.
 * @param pageName - Page name (e.g. "about").
 * @param meta - Page metadata entry.
 * @returns The human-readable page name (index → site name).
 */
function pageDisplayName(pageName: string, meta: PageMetaEntry): string {
  return pageName === "index" ? SITE_NAME : (meta.jsonLDPageName ?? pageName);
}

/**
 * Generate the `## Core Pages` file list from `PAGE_META` (full-tier pages
 * only), each entry linking to the page's markdown snapshot.
 * @returns The Core Pages markdown section.
 */
function corePagesSection(): string {
  const lines = ["## Core Pages", ""];
  for (const [pageName, meta] of Object.entries(PAGE_META)) {
    if (meta.tier !== "full") continue;
    lines.push(
      `- [${pageDisplayName(pageName, meta)}](${BASE_URL}/${markdownFileName(pageName)}): ${meta.description}`,
    );
  }
  return lines.join("\n");
}

/** Generate the complete llms.txt content. */
function generateLlmsTxt(): string {
  return [
    LLMS_TXT_INTRO,
    "",
    corePagesSection(),
    "",
    LLMS_TXT_STATIC_SECTIONS,
    "",
  ].join("\n");
}

// =========================================================================
// Markdown page versions
// =========================================================================

/** Render link-card groups as markdown file lists. */
function renderCardGroups(groups: LinkCardGroup[]): string {
  const parts: string[] = [];
  for (const group of groups) {
    const groupTitle = textFor(group.id);
    if (!groupTitle) continue;
    parts.push(`## ${groupTitle}`, "");
    if (group.contents && group.contents.length > 0) {
      for (const card of group.contents) {
        const cardTitle = textFor(card.id);
        const cardHref = card.titleLink?.href;
        const cardDesc = extractPlainText(card.description);
        const link = cardHref ? `[${cardTitle}](${cardHref})` : cardTitle;
        const descPart = cardDesc ? `: ${cardDesc}` : "";
        parts.push(`- ${link}${descPart}`);
      }
      parts.push("");
    }
  }
  return parts.join("\n").trimEnd();
}

/** Render link-button groups as markdown file lists. */
function renderButtonGroups(groups: LinkButtonGroup[]): string {
  const parts: string[] = [];
  for (const group of groups) {
    const groupTitle = group.groupId
      ? group.groupId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "";
    if (!groupTitle) continue;
    parts.push(`## ${groupTitle}`, "");
    if (group.buttons && group.buttons.length > 0) {
      for (const btn of group.buttons) {
        const label = btn.icon?.imgProps?.alt || textFor(btn.id) || "";
        const href = btn.link?.href || "";
        if (!label) continue;
        parts.push(href ? `- [${label}](${href})` : `- ${label}`);
      }
      parts.push("");
    }
  }
  return parts.join("\n").trimEnd();
}

/** Render picture-list groups as markdown file lists (id → relatedLink). */
function renderPictureGroups(groups: DisplayPictureGroup[]): string {
  const parts: string[] = [];
  for (const group of groups) {
    const groupTitle = textFor(group.id);
    if (!groupTitle) continue;
    parts.push(`## ${groupTitle}`, "");
    const description = extractPlainText(group.description);
    if (description) parts.push(description, "");
    if (group.contents && group.contents.length > 0) {
      for (const pic of group.contents) {
        const title = textFor(pic.id);
        const href = pic.relatedLink?.href;
        parts.push(href ? `- [${title}](${href})` : `- ${title}`);
      }
      parts.push("");
    }
  }
  return parts.join("\n").trimEnd();
}

/**
 * Strip leading HTML comment blocks and the first H1 from a markdown source
 * (the H1 is replaced by the generated page header).
 * @param md - The raw markdown source.
 * @returns The source body without leading comments and its H1.
 */
function stripSourceHeader(md: string): string {
  let body = md.replace(/^\s*<!--[\s\S]*?-->\s*/i, "").trimStart();
  body = body.replace(/^#\s+[^\n]*\n?/, "").trimStart();
  return body;
}

/**
 * Build the markdown snapshot body for a page from its JSON configs
 * (link cards / link buttons / picture list).
 * @param pageName - Page name (e.g. "about").
 * @returns The markdown body, or "" when the page has no content configs.
 */
function pageBody(pageName: string): string {
  const parts: string[] = [];

  const cards = loadLinkCardGroups(pageName);
  if (cards) {
    const md = renderCardGroups(cards);
    if (md) parts.push(md);
  }

  const buttons = loadLinkButtonGroups(pageName);
  if (buttons) {
    const md = renderButtonGroups(buttons);
    if (md) parts.push(md);
  }

  const pictures = loadPictureGroups(pageName);
  if (pictures) {
    const md = renderPictureGroups(pictures);
    if (md) parts.push(md);
  }

  return parts.filter(Boolean).join("\n\n");
}

/**
 * Generate the standard page header: `# <title>` + `> <description>`.
 * @param meta - Page metadata entry.
 * @returns The header markdown block.
 */
function pageHeader(meta: PageMetaEntry): string {
  return `# ${meta.title}\n\n> ${meta.description}\n`;
}

/**
 * Full markdown snapshot for a config-driven page.
 * @param pageName - Page name.
 * @param meta - Page metadata entry.
 * @returns The complete markdown file content.
 */
function generatePageMarkdown(pageName: string, meta: PageMetaEntry): string {
  return `${pageHeader(meta)}\n${pageBody(pageName)}\n`;
}

/**
 * Markdown snapshot for a markdown-source page (worldview / copyright-notice):
 * the raw English source with its leading comments + H1 replaced by the
 * standard page header.
 * @param sourcePath - Path to the raw markdown source (relative to cwd).
 * @param meta - Page metadata entry.
 * @returns The complete markdown file content.
 */
function generateSourcePageMarkdown(
  sourcePath: string,
  meta: PageMetaEntry,
): string {
  const raw = readFileSync(resolve(process.cwd(), sourcePath), "utf-8");
  const body = stripSourceHeader(raw);
  return `${pageHeader(meta)}\n${body}\n`;
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that generates `llms.txt` and markdown page versions in the
 * output directory after the bundle is written.
 * @returns A Vite Plugin object.
 */
export function llmsTxtPlugin(): Plugin {
  let outDir = "";

  return {
    name: "llms-txt-plugin",

    configResolved(config: ResolvedConfig): void {
      outDir = config.build.outDir;
    },

    writeBundle(): void {
      // --- Root llms.txt ---
      const llmsTxt = generateLlmsTxt();
      writeFileSync(resolve(outDir, "llms.txt"), llmsTxt, "utf-8");
      console.log("[llms-txt-plugin] Generated llms.txt");

      // --- Markdown page versions (full-tier pages only) ---
      for (const [pageName, meta] of Object.entries(PAGE_META)) {
        if (meta.tier !== "full") continue;

        let md: string;
        if (pageName === "worldview") {
          md = generateSourcePageMarkdown(
            "src/configs/i18n/en/worldview.md",
            meta,
          );
        } else if (pageName === "copyright-notice") {
          md = generateSourcePageMarkdown("public/images/README.md", meta);
        } else {
          md = generatePageMarkdown(pageName, meta);
        }

        writeFileSync(resolve(outDir, markdownFileName(pageName)), md, "utf-8");
        console.log(
          `[llms-txt-plugin] Generated ${markdownFileName(pageName)}`,
        );
      }
    },
  };
}
