/**
 * Utility functions.
 * Provides shared helpers for some logic used across multiple modules.
 */

import type { HastProperties } from "../types/hast";
import { INTERNAL_PAGES, EXCLUDED_PAGES } from "../configs/pages";

/**
 * Normalize a URL pathname so that the root maps to /index.html.
 * @param pathname - e.g. "/", "", "/about.html"
 * @returns e.g. "/index.html", "/about.html"
 */
export function normalizeInternalPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "/index.html";
  return pathname;
}

/**
 * Extract the page name (without .html extension) from a pathname.
 * The root path maps to "index".
 * @param pathname - e.g. "/", "/about.html", "/artworks-and-videos.html"
 * @returns e.g. "index", "about", "artworks-and-videos"
 */
export function extractPageName(pathname: string): string {
  const normalized = normalizeInternalPath(pathname);
  // normalized is like "/index.html" or "/about.html"
  const filename = normalized.split("/").pop();
  return filename!.replace(/\.html$/, "");
}

/**
 * Convert a string to dash-case.
 * Strips non-alphanumeric characters, replaces whitespace/underscores with hyphens.
 * @param text - The input string.
 * @returns The dash-cased string, or '' for null/undefined/empty input.
 */
export function toDashCase(text: string | undefined | null): string {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Recursively extract all plain text from a HAST node tree.
 * @param node - A HAST node object (root, element, text, or comment).
 * @returns The concatenated plain text content, or '' for non-text nodes.
 */
export function extractPlainText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as Record<string, unknown>;
  if (n.type === "text") return String(n.value || "");
  if (n.type === "comment") return "";
  if (Array.isArray(n.children)) {
    return n.children.map(extractPlainText).join("");
  }
  return "";
}

// =========================================================================
// I18n resolution for HAST-rendered HTML
// =========================================================================

/**
 * Post-process HTML output from `toHtml()` to resolve `data-i18n` and
 * `data-i18n-html` attributes into their translated values.
 *
 * This resolves HAST-rendered content (link cards, button groups)
 * without a legacy DOM walker.
 *
 * @param html - Raw HTML string from `toHtml()`.
 * @param t - i18n translation function (`t(key)`).
 * @returns HTML with all `data-i18n` attributes resolved to translated text,
 *          and the `data-i18n` / `data-i18n-html` attributes removed.
 */
export function resolveI18nInHtml(
  html: string,
  t: (key: string) => string,
): string {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  // Resolve data-i18n (textContent)
  doc.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
    el.removeAttribute("data-i18n");
  });

  // Resolve data-i18n-html (innerHTML)
  doc.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) {
      el.innerHTML = t(key);
    }
    el.removeAttribute("data-i18n-html");
  });

  return doc.body.innerHTML;
}
