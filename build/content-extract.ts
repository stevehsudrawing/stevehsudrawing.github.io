/**
 * Shared build-time content extraction.
 *
 * Loads the link-card / link-button-group / picture-list JSON configs and
 * resolves English i18n text at build time. Consumed by
 * content-injection-plugin (HTML noscript) and llms-txt-plugin (markdown
 * page versions).
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// =========================================================================
// JSON config types (subset of runtime types)
// =========================================================================

/** Minimal HAST node shape used by the JSON configs. */
export interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/** Type-aware link with href and type discriminator. */
export interface TypeAwareLink {
  href: string;
  type: string;
}

/** Type-aware image (picture or colored-img). */
export interface TypeAwareImage {
  type: "picture" | "colored-img";
  imgProps?: {
    src?: string;
    alt?: string;
  };
}

/** A single link card. */
export interface LinkCard {
  id: string;
  available?: boolean;
  icon?: TypeAwareImage;
  titleLink?: TypeAwareLink;
  description?: HastNode | null;
}

/** A group of link cards. */
export interface LinkCardGroup {
  id: string;
  description?: HastNode | null;
  contents?: LinkCard[];
}

/** A single link button. */
export interface LinkButton {
  id: string;
  link: TypeAwareLink;
  icon: TypeAwareImage;
}

/** A group of link buttons. */
export interface LinkButtonGroup {
  groupId?: string;
  buttons?: LinkButton[];
}

/** A single display picture (gallery). */
export interface DisplayPicture {
  id: string;
  pictureProps?: {
    srcMap?: unknown;
    feature?: string[];
  };
  qrCodeIcon?: TypeAwareImage;
  relatedLink?: TypeAwareLink;
}

/** A group of display pictures. */
export interface DisplayPictureGroup {
  id: string;
  description?: HastNode | null;
  contents?: DisplayPicture[];
}

// =========================================================================
// i18n text resolution (en/translation.json is the single source of truth)
// =========================================================================

let enCache: Record<string, string> | null = null;

/** Load the English translations once (titles + icon alt fallbacks). */
function getEn(): Record<string, string> {
  if (!enCache) {
    const raw = readFileSync(
      resolve(process.cwd(), "src/configs/i18n/en/translation.json"),
      "utf-8",
    );
    enCache = JSON.parse(raw) as Record<string, string>;
  }
  return enCache;
}

/**
 * Resolve `text-<id>` from the English translations, falling back to the raw id.
 * @param id - The config id (e.g. "pixiv").
 * @returns The English label for the id.
 */
export function textFor(id: string): string {
  return getEn()["text-" + id] ?? id;
}

// =========================================================================
// Config loaders
// =========================================================================

/**
 * Load and parse a page-scoped JSON config, returning `null` when absent.
 * @param pageName - Page name (e.g. "about").
 * @param dir - Config subdirectory under src/configs (e.g. "link-cards").
 * @returns The parsed array, or `null` when the file does not exist.
 */
function loadJson<T>(pageName: string, dir: string): T[] | null {
  const path = resolve(process.cwd(), "src/configs", dir, `${pageName}.json`);
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return null;
  }
}

/** Load the link-card groups for a page (or `null` when none exist). */
export function loadLinkCardGroups(pageName: string): LinkCardGroup[] | null {
  return loadJson<LinkCardGroup>(pageName, "link-cards");
}

/** Load the link-button groups for a page (or `null` when none exist). */
export function loadLinkButtonGroups(
  pageName: string,
): LinkButtonGroup[] | null {
  return loadJson<LinkButtonGroup>(pageName, "link-button-groups");
}

/** Load the picture-list groups for a page (or `null` when none exist). */
export function loadPictureGroups(
  pageName: string,
): DisplayPictureGroup[] | null {
  return loadJson<DisplayPictureGroup>(pageName, "picture-list");
}
