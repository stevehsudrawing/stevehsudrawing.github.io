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
import { BASE_URL } from "../src/configs/site-meta.ts";

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

/** One picture of the registry (`src/configs/picture-registry.json`). */
export interface RegistryPicture {
  id: string;
  pictureProps?: {
    srcMap?: unknown;
    feature?: string[];
    alt?: string;
    /** Optional literal title (language-neutral pictures, e.g. "SELF"). */
    title?: string;
    message?: string;
    relatedLink?: TypeAwareLink;
    aspectRatio?: number;
  };
}

/** A picture group (`src/configs/picture-groups.json`). */
export interface DisplayPictureGroup {
  id: string;
  description?: HastNode | null;
  /** Pages that render this group (build-time filter). */
  pages?: string[];
  /** Picture ids, resolved through the registry. */
  contents?: string[];
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

/**
 * Resolve a link-card label: `text-<id>-title` first, then the legacy
 * `text-<id>`, falling back to the raw id.  Mirrors the runtime
 * resolution in `LinkCard.vue` (v3.14.4) — a card whose id is also a
 * picture id shares the picture's title key.
 *
 * @param id - The config id (e.g. "sticker-collection-series-1-vol-1").
 * @returns The English label for the id.
 */
export function textForTitle(id: string): string {
  const en = getEn();
  return en["text-" + id + "-title"] ?? en["text-" + id] ?? id;
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

/**
 * Load one shared (page-independent) config file under `src/configs`.
 * @param file - File name (e.g. "picture-groups.json").
 * @returns The parsed array, or `null` when the file does not exist.
 */
function loadSingleton<T>(file: string): T[] | null {
  const path = resolve(process.cwd(), "src/configs", file);
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T[];
  } catch {
    return null;
  }
}

/**
 * Absolute URL of a page — the text / markdown renderers use it to
 * absolutize same-page query links (a bare `?picGroupId=…` is useless in
 * `*.html.md` / `llms.txt`).
 *
 * @param pageName - Page name (e.g. "gallery"); the index page is "index".
 * @returns The absolute page URL (no trailing slash).
 */
export function pageUrl(pageName: string): string {
  return `${BASE_URL}${pageName === "index" ? "/" : `/${pageName}.html`}`;
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

/** Load the whole picture group pool (or `null` when the file is absent). */
export function loadPictureGroups(): DisplayPictureGroup[] | null {
  return loadSingleton<DisplayPictureGroup>("picture-groups.json");
}

/** Load the picture registry (or `null` when the file is absent). */
export function loadPictureRegistry(): RegistryPicture[] | null {
  return loadSingleton<RegistryPicture>("picture-registry.json");
}
