/**
 * Vite plugin: inject auto-generated <noscript> content for SEO.
 *
 * Reads link-card and link-button-group JSON configs at build time and
 * generates plain-text link lists that crawlers can index without
 * executing JavaScript.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getPageName, extractHastHref } from "./utils";
import { extractPlainText } from "../src/core/utils";
import { PAGE_META } from "./page-meta";
import type { IndexHtmlTransformContext } from "vite";

// =========================================================================
// JSON config types (subset of runtime types)
// =========================================================================

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

interface LinkCard {
  title: HastNode;
  description?: HastNode | null;
}

interface LinkCardGroup {
  title?: HastNode | null;
  description?: HastNode | null;
  contents?: LinkCard[];
}

interface LinkButton {
  linkHref?: string;
  externalLink?: boolean;
  iconProps?: {
    alt?: string;
    src?: string;
  };
}

interface LinkButtonGroup {
  groupId?: string;
  buttons?: LinkButton[];
}

// =========================================================================
// Content generation
// =========================================================================

/**
 * Generate a plain-text noscript content block from link-card JSON data.
 * Extracts group titles, card titles (with hrefs), and descriptions.
 */
function generateCardNoscript(groups: LinkCardGroup[]): string {
  if (!groups || groups.length === 0) return "";

  const parts: string[] = [];

  for (const group of groups) {
    const groupTitle = extractPlainText(group.title);
    if (groupTitle) {
      parts.push(`<h3>${escapeHtml(groupTitle)}</h3>`);
    }

    const description = extractPlainText(group.description);
    if (description) {
      parts.push(`<p>${escapeHtml(description)}</p>`);
    }

    if (group.contents && group.contents.length > 0) {
      parts.push("<ul>");
      for (const card of group.contents) {
        const cardTitle = extractPlainText(card.title);
        const cardHref = extractHastHref(card.title);
        const cardDesc = extractPlainText(card.description);

        if (!cardTitle) continue;

        const link = cardHref
          ? `<a href="${escapeAttr(cardHref)}">${escapeHtml(cardTitle)}</a>`
          : escapeHtml(cardTitle);

        const descPart = cardDesc ? ` — ${escapeHtml(cardDesc)}` : "";
        parts.push(`<li>${link}${descPart}</li>`);
      }
      parts.push("</ul>");
    }
  }

  return parts.join("\n");
}

/**
 * Generate a plain-text noscript content block from link-button-group JSON data.
 * Uses button alt text as labels and linkHref as URLs.
 */
function generateButtonNoscript(groups: LinkButtonGroup[]): string {
  if (!groups || groups.length === 0) return "";

  const parts: string[] = [];

  for (const group of groups) {
    const groupTitle = group.groupId
      ? group.groupId
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "";

    if (groupTitle) {
      parts.push(`<h3>${escapeHtml(groupTitle)}</h3>`);
    }

    if (group.buttons && group.buttons.length > 0) {
      parts.push("<ul>");
      for (const btn of group.buttons) {
        const label = btn.iconProps?.alt || btn.linkHref || "";
        const href = btn.linkHref || "";

        if (!label) continue;

        parts.push(
          href
            ? `<li><a href="${escapeAttr(href)}">${escapeHtml(label)}</a></li>`
            : `<li>${escapeHtml(label)}</li>`,
        );
      }
      parts.push("</ul>");
    }
  }

  return parts.join("\n");
}

/**
 * Generate the full auto-generated noscript content for a given page.
 */
function generateNoscriptContent(pageName: string): string {
  const parts: string[] = [];
  const root = process.cwd();

  // --- Link cards ---
  const cardsPath = resolve(root, "src/configs/link-cards", `${pageName}.json`);
  try {
    const cardsRaw = readFileSync(cardsPath, "utf-8");
    const cards = JSON.parse(cardsRaw) as LinkCardGroup[];
    const html = generateCardNoscript(cards);
    if (html) {
      parts.push("<!-- auto-generated: link cards -->", html);
    }
  } catch {
    // No link-card config for this page — skip
  }

  // --- Link button groups ---
  const buttonsPath = resolve(
    root,
    "src/configs/link-button-groups",
    `${pageName}.json`,
  );
  try {
    const buttonsRaw = readFileSync(buttonsPath, "utf-8");
    const buttons = JSON.parse(buttonsRaw) as LinkButtonGroup[];
    const html = generateButtonNoscript(buttons);
    if (html) {
      parts.push("<!-- auto-generated: link buttons -->", html);
    }
  } catch {
    // No link-button-group config for this page — skip
  }

  return parts.join("\n");
}

// =========================================================================
// HTML escaping
// =========================================================================

/** Escape text for safe use inside HTML element content. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Escape a value for safe use inside an HTML attribute (double-quoted). */
function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that injects auto-generated <noscript> link lists
 * from JSON configs for SEO crawlers.
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

        const noscriptContent = generateNoscriptContent(pageName);
        if (!noscriptContent) return html;

        // Inject before </noscript>
        return html.replace("</noscript>", `\n${noscriptContent}\n</noscript>`);
      },
    },
  };
}
