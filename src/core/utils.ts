/**
 * Utility functions.
 * Provides shared helpers for some logic used across multiple modules.
 */

import type { HastProperties } from "../types/hast";

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
 * Set multiple attributes and/or classes on a DOM element from a properties object.
 * Special handling: 'className' can be a string or array and is added via classList.
 * camelCase data* keys (hast convention) are converted to data-* kebab-case.
 * Values of false, null, or undefined are skipped.
 * @param element - The target element.
 * @param properties - Key/value pairs to set as attributes.
 */
export function setElementAttributes(
  element: HTMLElement,
  properties: HastProperties = {},
): void {
  Object.entries(properties).forEach(([key, value]) => {
    if (key === "className") {
      if (Array.isArray(value)) {
        (value as string[]).forEach((cls) => element.classList.add(cls));
      }
      return;
    }

    if (value === false || value === null || value === undefined) {
      return;
    }

    // Convert camelCase data* keys to data-* kebab-case (hast convention).
    // e.g. dataImgFeature -> data-img-feature, dataI18n -> data-i18n.
    const attrName = /^data[A-Z]/.test(key)
      ? key
          .replace(/^data([A-Z])/, (_, c: string) => "data-" + c.toLowerCase())
          .replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())
      : key;

    element.setAttribute(attrName, String(value));
  });
}

/**
 * Extract a readable message from any rejection value.
 * @param error - The rejection value.
 */
export function errMsg(error: unknown): string {
  return error && typeof error === "object" && "message" in error
    ? String((error as { message: unknown }).message)
    : JSON.stringify(error);
}

/**
 * List of internal page paths that support page transitions.
 */
export const INTERNAL_PAGES = [
  "/index.html",
  "/about.html",
  "/artworks-and-videos.html",
  "/blogs-and-sponsor.html",
  "/chatting.html",
  "/softwares.html",
  "/copyright-notice.html",
] as const;

/**
 * List of page paths excluded from the page transition system.
 * These pages will always trigger a full browser navigation.
 */
export const EXCLUDED_PAGES = [
  "/404.html",
  "/error-javascript-disabled.html",
  "/error-unsupported-browser.html",
] as const;

/**
 * Determine if a URL is an internal page that should be handled by the transition system.
 * @param url - The URL to check, can be relative or absolute.
 * @returns True if the URL points to an internal page eligible for transitions.
 */
export function isInternalPage(url: string): boolean {
  try {
    // Hash anchors are obviously internal pages
    if (url.indexOf("#") === 0) return true;
    const target = new URL(url, window.location.origin);
    // Must be same origin
    if (target.origin !== window.location.origin) return false;
    // Must be one of our known internal pages
    const path = target.pathname;
    return (
      (INTERNAL_PAGES as readonly string[]).includes(path) &&
      !(EXCLUDED_PAGES as readonly string[]).includes(path)
    );
  } catch {
    return false;
  }
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
 * This eliminates the need for the legacy `core/i18n.ts` DOM walker to
 * handle HAST-rendered content (link cards, button groups).
 *
 * @param html - Raw HTML string from `toHtml()`.
 * @param t - i18n translation function (`t(key, fallback)`).
 * @returns HTML with all `data-i18n` attributes resolved to translated text,
 *          and the `data-i18n` / `data-i18n-html` attributes removed.
 */
export function resolveI18nInHtml(
  html: string,
  t: (key: string, fallback?: string) => string,
): string {
  if (!html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  // Resolve data-i18n (textContent)
  doc.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key, el.textContent ?? "");
    }
    el.removeAttribute("data-i18n");
  });

  // Resolve data-i18n-html (innerHTML)
  doc.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) {
      el.innerHTML = t(key, el.innerHTML);
    }
    el.removeAttribute("data-i18n-html");
  });

  return doc.body.innerHTML;
}
