/**
 * Vite plugin: inject auto-generated <noscript> content for SEO.
 *
 * Reads link-card and link-button-group JSON configs at build time and
 * generates plain-text link lists that crawlers can index without
 * executing JavaScript. Config loading + i18n resolution lives in
 * content-extract.ts (shared with llms-txt-plugin).
 */

import { getPageName } from "./utils";
import { extractPlainText } from "../src/core/utils";
import { PAGE_META } from "./site-meta";
import {
  loadLinkCardGroups,
  loadLinkButtonGroups,
  textFor,
  type LinkCardGroup,
  type LinkButtonGroup,
} from "./content-extract";
import type { IndexHtmlTransformContext } from "vite";

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
    const groupTitle = textFor(group.id);
    if (groupTitle) {
      parts.push(`<h2>${escapeHtml(groupTitle)}</h2>`);
    }

    const description = extractPlainText(group.description);
    if (description) {
      parts.push(`<p>${escapeHtml(description)}</p>`);
    }

    if (group.contents && group.contents.length > 0) {
      parts.push("<ul>");
      for (const card of group.contents) {
        const cardTitle = textFor(card.id);
        const cardHref = card.titleLink?.href;
        const cardDesc = extractPlainText(card.description);

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
      parts.push(`<h2>${escapeHtml(groupTitle)}</h2>`);
    }

    if (group.buttons && group.buttons.length > 0) {
      parts.push("<ul>");
      for (const btn of group.buttons) {
        const label = btn.icon?.imgProps?.alt || textFor(btn.id) || "";
        const href = btn.link?.href || "";

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

  // --- Link cards ---
  const cards = loadLinkCardGroups(pageName);
  if (cards) {
    const html = generateCardNoscript(cards);
    if (html) {
      parts.push("<!-- auto-generated: link cards -->", html);
    }
  }

  // --- Link button groups ---
  const buttons = loadLinkButtonGroups(pageName);
  if (buttons) {
    const html = generateButtonNoscript(buttons);
    if (html) {
      parts.push("<!-- auto-generated: link buttons -->", html);
    }
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
