/**
 * HAST-to-Vue extraction helpers.
 *
 * Converts link-card HAST JSON nodes into plain props objects that
 * Vue components (TypeAwareLink, FeatureAwarePicture, ColoredImg)
 * can consume directly — replacing the v-html + event-delegation
 * pipeline.
 */

import { INTERNAL_PAGES } from "../../configs/pages";
import { normalizeInternalPath } from "../../core/utils";
import type {
  ColoredImgProps,
  FeatureAwarePictureProps,
  ImgFeature,
} from "../../types/app";
import type { HastNode } from "../../types/hast";

// =========================================================================
// Types
// =========================================================================

/** Props extracted from a HAST `<a>` node for TypeAwareLink. */
export interface ExtractedLinkProps {
  href: string;
  /** Link type — derived from className + href. */
  type: "external" | "internal" | "email" | "anchor" | "static";
  /** Plain-text content of the link (resolved i18n). */
  textContent: string;
}

// =========================================================================
// Helpers
// =========================================================================

/**
 * Parse a space-separated HAST feature string into ImgFeature[].
 * Filters out "colored" — it is not an ImgFeature.
 */
function parseFeatures(raw: string | undefined): ImgFeature[] {
  if (!raw) return [];
  const validFeatures: ImgFeature[] = ["follow-theme", "follow-language"];
  return raw
    .split(" ")
    .filter((f): f is ImgFeature => (validFeatures as string[]).includes(f));
}

/**
 * Classify a scheme-less href as an SPA page (`internal`) or anything else
 * that needs a full-page load (`static`).
 *
 * The page inventory (`INTERNAL_PAGES`) is the boundary: a `.html` file it
 * lists stays in the SPA; every other target — a sub-site directory
 * (`/articles/index.html`, `/skinview3d-etf/`), an asset, a non-page path —
 * leaves the SPA.  A query-only href (`?lang=…`) stays on the current page.
 *
 * @param href - The raw href (never scheme-bearing, never a bare `#hash`).
 * @returns `internal` or `static`.
 */
function classifyRelativeHref(href: string): "internal" | "static" {
  const path = href.split(/[?#]/)[0];
  if (!path) return "internal";
  const normalized = normalizeInternalPath(
    path.startsWith("/") ? path : `/${path}`,
  );
  return INTERNAL_PAGES.includes(normalized) ? "internal" : "static";
}

// =========================================================================
// Picture extraction
// =========================================================================

/**
 * Extract FeatureAwarePictureProps from a HAST `<img>` node.
 * Resolves `dataI18nAlt` via the provided translation function.
 *
 * @param imgNode - HAST element node with tagName "img".
 * @param t - Translation function for dataI18nAlt.
 * @returns FeatureAwarePictureProps, or null if the node is not an img.
 */
export function extractPictureProps(
  imgNode: HastNode,
  t: (key: string) => string,
): FeatureAwarePictureProps | null {
  if (imgNode.type !== "element" || imgNode.tagName !== "img") return null;

  const props = imgNode.properties ?? {};
  const altKey = (props.dataI18nAlt as string) ?? "";
  const src = (props.src as string) ?? "";

  return {
    src,
    alt: altKey ? t(altKey) : ((props.alt as string) ?? ""),
    feature: parseFeatures(props.dataImgFeature as string | undefined),
  };
}

// =========================================================================
// ColoredImg extraction
// =========================================================================

/**
 * Extract ColoredImgProps from a HAST `<img>` node.
 * Used when `dataImgFeature` includes "colored".
 *
 * @param imgNode - HAST element node with tagName "img".
 * @param t - Translation function for dataI18nAlt.
 * @returns ColoredImgProps, or null if the node is not an img.
 */
export function extractColoredImgProps(
  imgNode: HastNode,
  t: (key: string) => string,
): ColoredImgProps | null {
  if (imgNode.type !== "element" || imgNode.tagName !== "img") return null;

  const props = imgNode.properties ?? {};
  const altKey = (props.dataI18nAlt as string) ?? "";

  return {
    src: (props.dataSrcMask as string) ?? (props.src as string) ?? "",
    colorVar: (props.dataColorVar as string) ?? "shlh-primary-color",
    alt: altKey ? t(altKey) : ((props.alt as string) ?? ""),
  };
}

// =========================================================================
// Link extraction
// =========================================================================

/**
 * Extract props for TypeAwareLink from a HAST `<a>` node.
 * Determines the link type from `className` and `href`, in this order:
 *
 *   1. `external-link` className → external
 *   2. `static-link` className → static
 *   3. `internal-link` className → internal
 *   4. `#hash` → anchor; `mailto:` / `tel:` → email
 *   5. any other scheme (`//host`, `http(s):`, …) → external
 *   6. otherwise → resolved against the SPA page inventory
 *      (see `classifyRelativeHref`)
 *
 * @param aNode - HAST element node with tagName "a".
 * @param t - Translation function for child `dataI18n` text.
 * @returns ExtractedLinkProps, or null if the node is not an `<a>`.
 */
export function extractLinkProps(
  aNode: HastNode,
  t: (key: string) => string,
): ExtractedLinkProps | null {
  if (aNode.type !== "element" || aNode.tagName !== "a") return null;

  const props = aNode.properties ?? {};
  const href = (props.href as string) ?? "";
  const rawClassName = props.className;
  const classNames = Array.isArray(rawClassName)
    ? rawClassName
    : typeof rawClassName === "string"
      ? rawClassName.split(/\s+/)
      : [];

  // — Determine link type --
  let type: ExtractedLinkProps["type"];

  if (classNames.includes("external-link")) {
    type = "external";
  } else if (classNames.includes("static-link")) {
    type = "static";
  } else if (classNames.includes("internal-link")) {
    type = "internal";
  } else if (href.startsWith("#")) {
    type = "anchor";
  } else if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    type = "email";
  } else if (href.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(href)) {
    type = "external";
  } else {
    type = classifyRelativeHref(href);
  }

  // — Extract plain-text content (resolve dataI18n on child spans) --
  const textContent = resolveHastTextContent(aNode, t);

  return { href, type, textContent };
}

// =========================================================================
// Text resolution
// =========================================================================

/**
 * Recursively resolve the plain-text content of a HAST node,
 * applying i18n translation on elements with `dataI18n` or
 * `dataI18nAlt` properties.
 */
function resolveHastTextContent(
  node: HastNode,
  t: (key: string) => string,
): string {
  if (node.type === "text") return (node.value as string) ?? "";

  if (node.type === "element") {
    const props = node.properties ?? {};
    const i18nKey =
      (props.dataI18n as string) ?? (props.dataI18nAlt as string) ?? "";

    const childText = (node.children ?? [])
      .map((c) => resolveHastTextContent(c, t))
      .join("");

    if (i18nKey) return t(i18nKey);
    return childText;
  }

  return "";
}
