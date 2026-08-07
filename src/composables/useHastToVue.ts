/**
 * HAST-to-Vue extraction helpers.
 *
 * Converts link-card HAST JSON nodes into plain props objects that
 * Vue components (TypeAwareLink, FeatureAwareImg) can consume
 * directly — replacing the v-html + event-delegation pipeline.
 */

import type { HastNode } from "../types/hast";
import type { FeatureAwareImgProps } from "../types/app";

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
// Img extraction
// =========================================================================

/**
 * Extract FeatureAwareImgProps from a HAST `<img>` node.
 * Resolves `dataI18nAlt` via the provided translation function.
 *
 * @param imgNode - HAST element node with tagName "img".
 * @param t - Translation function for dataI18nAlt.
 * @returns FeatureAwareImgProps, or null if the node is not an img.
 */
export function extractImgProps(
  imgNode: HastNode,
  t: (key: string, fallback?: string) => string,
): FeatureAwareImgProps | null {
  if (imgNode.type !== "element" || imgNode.tagName !== "img") return null;

  const props = imgNode.properties ?? {};
  const altKey = (props.dataI18nAlt as string) ?? "";

  return {
    lightSrc: (props.src as string) ?? "",
    alt: altKey
      ? t(altKey, (props.alt as string) ?? "")
      : ((props.alt as string) ?? ""),
    feature: (props.dataImgFeature as string) ?? undefined,
    colorMaskSrc: (props.dataSrcMask as string) ?? undefined,
    colorVar: (props.dataColorVar as string) ?? undefined,
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
  t: (key: string, fallback?: string) => string,
): ExtractedLinkProps | null {
  if (aNode.type !== "element" || aNode.tagName !== "a") return null;

  const props = aNode.properties ?? {};
  const href = (props.href as string) ?? "";
  const className = props.className;

  // -- Determine link type --
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
  }

  // -- Extract plain-text content (resolve dataI18n on child spans) --
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
  t: (key: string, fallback?: string) => string,
): string {
  if (node.type === "text") return (node.value as string) ?? "";

  if (node.type === "element") {
    const props = node.properties ?? {};
    const i18nKey =
      (props.dataI18n as string) ?? (props.dataI18nAlt as string) ?? "";
    const fallback = (props.alt as string) ?? "";

    const childText = (node.children ?? [])
      .map((c) => resolveHastTextContent(c, t))
      .join("");

    if (i18nKey) return t(i18nKey, childText || fallback);
    return childText;
  }

  return "";
}
