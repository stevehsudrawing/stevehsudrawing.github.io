/**
 * Application-wide shared types.
 * Centralises string literal types, enums, and constants
 * that are used across multiple modules.
 */

// =========================================================================
// String literal types
// =========================================================================

/** Supported language codes. */
export type Lang = "en" | "zh-Hans" | "zh-Hant";

/** User-selectable theme choices. */
export type ThemeChoice = "auto" | "light" | "dark";

/** Effective (resolved) theme - always light or dark. */
export type EffectiveTheme = "light" | "dark";

// =========================================================================
// localStorage keys
// =========================================================================

export const enum StorageKey {
  Theme = "bsTheme",
  Lang = "preferredLang",
  OpenInNewTab = "openExternalLinksInNewTab",
  EnableAnimations = "enableAnimations",
}

// =========================================================================
// CustomEvent names
// =========================================================================

export const enum AppEvent {
  /** Dispatched when the user requests a language switch via UI. detail = { lang: string } */
  LangSwitchRequested = "langSwitchRequested",
}

// =========================================================================
// Link-card data (used by Vue components and the build-time builder)
// =========================================================================

import type { HastNode, HastProperties } from "./hast";

/** Link-card descriptor — a single card with icon, title, and description. */
export interface CardData {
  /** When not true, the card gets an opacity-75 treatment. */
  available?: boolean;
  /** HAST `<img>` element for the card icon. */
  icon?: HastNode;
  /** HAST node (usually `<a>` or `<span>`) for the card title. */
  title?: HastNode;
  /** HAST root node for the card description text. */
  description?: HastNode | null;
}

/** Link-card group descriptor — a titled section containing multiple link cards. */
export interface GroupData {
  /** HAST node for the group title (rendered inside `<h2>`). */
  title?: HastNode;
  /** HAST root node for the group description (rendered inside `<p class="card-text">`). */
  description?: HastNode | null;
  /** Array of link cards within this group. */
  contents?: CardData[];
}

/** Link-button descriptor for a single button in a button group. */
export interface LinkButtonData {
  /** Whether the link points to an external site. */
  externalLink: boolean;
  /** Target URL for the button link. */
  linkHref: string;
  /** HAST-format properties for the button's icon `<img>`. */
  iconProps: HastProperties;
  /** When true, the button gets btn-primary styling. */
  primary?: boolean;
}

/** Link-button-group descriptor — a set of buttons with a group ID. */
export interface LinkButtonGroupData {
  /** Matches the data-group-id attribute on the injection placeholder. */
  groupId: string;
  /** Array of button definitions within this group. */
  buttons: LinkButtonData[];
}
