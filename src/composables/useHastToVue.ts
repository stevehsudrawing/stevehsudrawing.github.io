/**
 * HAST-to-Vue extraction helpers.
 *
 * Converts link-card HAST JSON nodes into plain props objects that
 * Vue components (TypeAwareLink, FeatureAwarePicture, ColoredImg)
 * can consume directly — replacing the v-html + event-delegation
 * pipeline.
 */

import type { HastNode } from "../types/hast";
import type {
  ImgFeature,
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../types/app";

// =========================================================================
// Types
// =========================================================================

/** Props extracted from a HAST `<a>` node for TypeAwareLink. */
export interface ExtractedLinkProps {
  href: string;
  /** Link type — derived from className + href. */
  type: "external" | "internal" | "email" | "anchor";
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

/** Check whether the HAST feature string includes "colored". */
function isColored(raw: string | undefined): boolean {
  return raw?.split(" ").includes("colored") ?? false;
}

/**
 * Whether an href points to an internal (same-site) page.
 * Scheme / protocol-relative URLs (`http:`, `https:`, `//host`, `mailto:`,
 * `tel:`, …) are external; everything else (root-relative `/...` or plain
 * relative paths, including query strings) resolves to the current origin
 * and is treated as an internal SPA link.
 * @param href - The raw href.
 */
function isInternalHref(href: string): boolean {
  if (!href || href.startsWith("//")) return false;
  return !/^[a-z][a-z0-9+.-]*:/i.test(href);
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
 * Determines the link type from `className` and `href`.
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
  const className = props.className;

  // — Determine link type --
  let type: ExtractedLinkProps["type"] = "external";

  if (href.startsWith("#")) {
    type = "anchor";
  } else if (href.startsWith("mailto:") || href.startsWith("tel:")) {
    type = "email";
  } else if (Array.isArray(className) && className.includes("internal-link")) {
    type = "internal";
  } else if (
    typeof className === "string" &&
    className.includes("internal-link")
  ) {
    type = "internal";
  } else if (isInternalHref(href)) {
    // Root-relative / relative paths (e.g. `/worldview.html?lang=zh-Hans`)
    // are internal SPA pages.  Link-card configs annotate them with an
    // `internal-link` class; markdown-produced links carry no such class,
    // so classify them here.
    type = "internal";
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
