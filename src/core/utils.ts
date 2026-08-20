/**
 * Utility functions.
 * Provides shared helpers for some logic used across multiple modules.
 */

import type { HastProperties } from "../types/hast";
import { INTERNAL_PAGES, EXCLUDED_PAGES } from "../configs/pages";
import type { LocationQueryRaw } from "vue-router";
import type { Lang, LanguageAwareString, PictureSrcMap } from "../types/app";

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
 * Resolve a language-aware value (image src URL or markdown content) with
 * an English fallback.
 * @param value - The language-keyed map, or undefined.
 * @param lang - The active language.
 * @returns The value for `lang`, falling back to `en`, or "".
 */
export function resolveLanguageAwareString(
  value: LanguageAwareString | undefined,
  lang: Lang,
): string {
  return value?.[lang as keyof LanguageAwareString] ?? value?.en ?? "";
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

/**
 * Merge the current `?lang=` query param into a replacement query object.
 *
 * Reads the live URL directly because `useI18n.setLocale()` writes the lang
 * param via `history.replaceState`, which Vue Router does not observe
 * reactively — so `route.query` can be stale after a language switch.
 *
 * @param query - New query object for `router.replace`.
 * @returns The query with `lang` merged (when present in the URL).
 */
export function preserveLangParam(query: LocationQueryRaw): LocationQueryRaw {
  const lang = new URLSearchParams(window.location.search).get("lang");
  if (lang) return { ...query, lang };
  return query;
}

// =========================================================================
// Sticker image source maps
// =========================================================================

/**
 * Build the theme/format-aware source map for a sticker image.
 * Derives the four paths from a `stickerId`:
 *   `/images/{avif|webp}/stickers/{light|dark}/{stickerId}.{ext}`
 * Shared by StickerSection and StickerModal (single source of truth).
 *
 * @param stickerId - Sticker filename stem (e.g. "observing").
 * @returns A PictureSrcMap with avif + webp light/dark variants.
 */
export function createStickerSrcMap(stickerId: string): PictureSrcMap {
  return {
    avif: {
      light: { en: `/images/avif/stickers/light/${stickerId}.avif` },
      dark: { en: `/images/avif/stickers/dark/${stickerId}.avif` },
    },
    webp: {
      light: { en: `/images/webp/stickers/light/${stickerId}.webp` },
      dark: { en: `/images/webp/stickers/dark/${stickerId}.webp` },
    },
  };
}
