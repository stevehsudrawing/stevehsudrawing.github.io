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

// =========================================================================
// Vue component properties
// =========================================================================

/** Image properties for FeatureAwareImg (shared by TypeAwareLink, QRCodeButton). */
export interface FeatureAwareImgProps {
  /** Fallback / PNG source — light mode. */
  lightSrc: string;
  /** Fallback / PNG source — dark mode. */
  darkSrc?: string;
  /** Space-separated feature flags (e.g. "colored", "follow-theme"). */
  feature?: string;
  /** Mask image for "colored" feature. */
  colorMaskSrc?: string;
  /** CSS variable for "colored" tint. */
  colorVar?: string;
  /** Alt text (pre-resolved from i18n). */
  alt: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
}

/**
 * Image properties for HeroSection's FeatureAwarePicture.
 * Prop names mirror FeatureAwarePicture.vue so `v-bind="image"`
 * passes them through directly.
 */
export interface HeroImageProps {
  /** AVIF source — light mode. */
  avifSrcLight: string;
  /** AVIF source — dark mode. */
  avifSrcDark?: string;
  /** WebP source — light mode. */
  webpSrcLight?: string;
  /** WebP source — dark mode. */
  webpSrcDark?: string;
  /** PNG / fallback source — light mode (required). */
  fallbackSrcLight: string;
  /** PNG / fallback source — dark mode. */
  fallbackSrcDark?: string;
  /** Space-separated feature flags (e.g. "follow-theme"). */
  feature?: string;
  /** HTML alt attribute (pre-resolved from i18n by the parent). */
  alt: string;
  /** Additional CSS classes for the img element. */
  imgClass?: string;
  /** fetchpriority attribute (e.g. "high"). */
  fetchpriority?: string;
}

// =========================================================================
// Provide / inject keys (cross-component communication)
// =========================================================================

/**
 * Injection key for the external-link confirmation flow.
 * Provided by App.vue; consumed by TypeAwareLink.
 */
export const OPEN_EXTERNAL_LINK_KEY = Symbol("openExternalLink");

/**
 * Injection key for the QR code modal.
 * Provided by App.vue; consumed by QRCodeButton.
 */
export const OPEN_QR_CODE_KEY = Symbol("openQRCode");

/**
 * Injection key for the Settings modal.
 * Provided by App.vue; consumed by AppNavbar (gear button).
 */
export const OPEN_SETTINGS_KEY = Symbol("openSettings");
