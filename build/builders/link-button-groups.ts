/**
 * Build-time link-button-groups HTML generator.
 * Reads simplified JSON configs, builds HAST trees, and serializes to HTML
 * strings for injection into button-group placeholders during Vite's
 * transformIndexHtml.
 *
 * Unlike link-cards, these configs are NOT full HAST - they use a simplified
 * data structure (LinkButtonData) that the builder converts into HAST.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { toHtml } from "hast-util-to-html";
import { h } from "hastscript";
import type { Node, LinkButtonData, LinkButtonGroupData } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a single link-button as a HAST element node. */
function buildButtonNode(button: LinkButtonData): Node {
  const { externalLink, linkHref, iconProps, primary } = button;

  const linkClass = externalLink ? "external-link" : "internal-link";
  const btnClass = primary ? "btn-primary" : "btn-outline-secondary";

  const aProps: Record<string, unknown> = {
    className: ["btn", btnClass, "link-btn-img-wrapper", linkClass],
    href: linkHref,
    dataBsToggle: "tooltip",
  };

  // Derive tooltip from icon alt
  const alt = iconProps.alt as string | undefined;
  if (alt) {
    aProps.dataBsTitle = alt;
  }

  // Derive i18n tooltip from icon's i18n alt
  if (iconProps.dataI18nAlt) {
    aProps.dataI18nTooltip = iconProps.dataI18nAlt;
  }

  // External links carry data-link-img-props for the confirmation modal.
  // Always use the ORIGINAL iconProps (not display-transformed ones) so
  // the modal icon is visible regardless of the primary color treatment.
  if (externalLink) {
    aProps.dataLinkImgProps = JSON.stringify(iconProps);
  } else {
    aProps.dataNoQrCode = true;
  }

  // Build the <img> child.
  // When primary is true, transform iconProps for display:
  //   - Replace src with null.webp
  //   - Set colored feature pointing to the original src as mask
  //   - Use shlh-primary-color for tinting
  //   - Keep alt, dataI18nAlt, and className from original
  const imgProperties: Record<string, unknown> = primary
    ? buildPrimaryImgProps(iconProps)
    : { ...iconProps };

  const imgNode: Node = {
    type: "element",
    tagName: "img",
    properties: imgProperties,
    children: [],
  };

  return h("a", aProps as Record<string, string>, imgNode);
}

/**
 * Build display image properties for a primary button.
 * Primary buttons use the colored image feature to tint the icon with
 * the theme's primary color, ensuring visibility on the btn-primary background.
 * The original iconProps are preserved separately for data-link-img-props.
 *
 * If the original iconProps already uses the colored feature (dataImgFeature
 * and dataSrcMask), the existing dataSrcMask is reused. Otherwise, the
 * original src is used as the mask source.
 */
function buildPrimaryImgProps(
  iconProps: Record<string, unknown>,
): Record<string, unknown> {
  const srcMask =
    iconProps.dataImgFeature === "colored" && iconProps.dataSrcMask
      ? iconProps.dataSrcMask
      : iconProps.src;

  const props: Record<string, unknown> = {
    alt: iconProps.alt,
    src: "/images/webp/null.webp",
    dataImgFeature: "colored",
    dataSrcMask: srcMask,
    dataColorVar: "shlh-primary-color",
  };

  // Preserve i18n and className from original if present
  if (iconProps.dataI18nAlt) {
    props.dataI18nAlt = iconProps.dataI18nAlt;
  }
  if (iconProps.className) {
    props.className = iconProps.className;
  }

  return props;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Read the link-button-groups JSON for a page and generate HTML for a
 * specific group.
 * @param pageName - e.g. "index"
 * @param groupId  - e.g. "artworks"
 * @returns The pre-rendered HTML for the button group, or '' if not found.
 */
export function buildLinkButtonGroupHTML(
  pageName: string,
  groupId: string,
): string {
  const jsonPath = resolve(
    __dirname,
    "..",
    "configs",
    "link-button-groups",
    `${pageName}.json`,
  );

  let groups: LinkButtonGroupData[];
  try {
    const raw = readFileSync(jsonPath, "utf-8");
    groups = JSON.parse(raw) as LinkButtonGroupData[];
  } catch {
    return "";
  }

  if (!Array.isArray(groups)) return "";

  const group = groups.find((g) => g.groupId === groupId);
  if (!group || !Array.isArray(group.buttons) || group.buttons.length === 0)
    return "";

  const buttonNodes = group.buttons.map(buildButtonNode);

  // Wrap in <div class="btn-group link-button-group">
  const wrapper = h("div.btn-group.link-button-group", ...buttonNodes);

  return toHtml(wrapper as Parameters<typeof toHtml>[0]);
}
