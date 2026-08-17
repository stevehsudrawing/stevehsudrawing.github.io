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

/**
 * Responsive breakpoint tiers aligned with Bootstrap's md / xl / xxl
 * thresholds.
 */
export type Breakpoint = "mobile" | "tablet" | "desktop" | "wideDesktop";

// =========================================================================
// localStorage keys
// =========================================================================

export const enum StorageKey {
  Theme = "theme",
  Lang = "lang",
  OpenInNewTab = "openInNewTab",
  EnableAnimations = "enableAnimations",
  /** Cached GitHub user profile data (JSON-serialized CacheEntry<GitHubUser>). */
  GithubProfile = "githubProfile",
  /** Cached GitHub events data (JSON-serialized CacheEntry<GitHubEvent[]>). */
  GithubEvents = "githubEvents",
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
  /** When true, the URL is a personal profile listed in JSON-LD `sameAs`. */
  sameAs?: boolean;
}

/** Link-button-group descriptor — a set of buttons with a group ID. */
export interface LinkButtonGroupData {
  /** Matches the data-group-id attribute on the injection placeholder. */
  groupId: string;
  /** Array of button definitions within this group. */
  buttons: LinkButtonData[];
}

// =========================================================================
// Picture-list data (Gallery page)
// =========================================================================

/** Picture descriptor — a single displayable poster in a gallery group. */
export interface DisplayPictureData {
  /**
   * Unique id — i18n key suffix (`t("text-" + id)`) for the alt-text
   * fallback and the lightbox deep-link target (`?preview=<id>`).
   */
  id: string;
  /**
   * FeatureAwarePictureProps for the poster.
   * `alt` is optional — when omitted the card/viewer falls back to
   * `t("text-" + id)`.  width/height are omitted (masonry CSS controls
   * the layout) and `loading` defaults to lazy in the card component.
   */
  pictureProps: FeatureAwarePictureProps;
  /** QR share-card centre overlay icon — picture variant (optional). */
  qrCodeIconPictureProps?: FeatureAwarePictureProps;
  /** QR share-card centre overlay icon — colored variant (optional). */
  qrCodeIconColoredProps?: ColoredImgProps | null;
  /**
   * Typed link back to a related section on another page
   * (e.g. internal → "/artworks-and-videos.html#sticker-collections").
   */
  relatedLink?: TypeAwareLinkProps;
}

/** Picture-list group descriptor — a titled gallery section. */
export interface DisplayPictureGroupData {
  /**
   * i18n key suffix for the SectionHeading title (`t("text-" + id)`)
   * plus the stable, language-independent anchor id.
   */
  id: string;
  /** HAST node for the group description (rendered like LinkCardGroup). */
  description?: HastNode | null;
  /** Array of pictures within this group. */
  contents: DisplayPictureData[];
}

// =========================================================================
// Vue component properties
// =========================================================================

// -------------------------------------------------------------------------
// Image feature flags
// -------------------------------------------------------------------------

/** Valid image feature flags for FeatureAwarePicture. */
export type ImgFeature = "follow-theme" | "follow-language";

// -------------------------------------------------------------------------
// Responsive image source maps
// -------------------------------------------------------------------------

/**
 * Language-keyed image source map — keys derived from `Lang`.
 * `en` is required — it is the ultimate fallback when a language variant
 * is not specified.
 */
export type LanguageAwareImgSrcMap = {
  en: string;
} & Partial<Record<Exclude<Lang, "en">, string>>;

/**
 * Theme-keyed image source map.
 * `light` is required — it is the ultimate fallback when a dark variant
 * is not specified.
 */
export interface ThemeAwareImgSrcMap {
  light: LanguageAwareImgSrcMap;
  dark?: LanguageAwareImgSrcMap;
}

/**
 * Format-keyed source map for `<picture>` element.
 * `webp` is required (browser baseline requirement); `avif` is optional.
 * When `avif` is present, the component renders a `<picture>` with both
 * `<source>` elements; otherwise a bare `<img>` is rendered.
 */
export interface PictureSrcMap {
  webp: ThemeAwareImgSrcMap;
  avif?: ThemeAwareImgSrcMap;
}

// -------------------------------------------------------------------------
// ColoredImg props
// -------------------------------------------------------------------------

/** Props for the ColoredImg component (CSS mask + tint rendering). */
export interface ColoredImgProps {
  /** Mask image source (the SVG/PNG shape). */
  src: string;
  /** CSS variable name for the tint color (e.g. "shlh-primary-color"). */
  colorVar: string;
  /** Alt text (pre-resolved from i18n). */
  alt: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
  /** Additional CSS classes. */
  class?: string;
  /** Native lazy loading. */
  loading?: "lazy" | "eager";
}

// -------------------------------------------------------------------------
// FeatureAwarePicture props (unified — replaces FeatureAwareImgProps + HeroImageProps)
// -------------------------------------------------------------------------

/** Props for the FeatureAwarePicture component — the sole non-colored image component. */
export interface FeatureAwarePictureProps {
  /**
   * Static src URL.
   * Use for plain images (GitHub avatars, external favicons, etc.).
   * Mutually exclusive with `srcMap`.
   */
  src?: string;
  /**
   * Structured multi-format source map.
   * Use with `feature` for theme/language-aware resolution.
   * Mutually exclusive with `src`.
   */
  srcMap?: PictureSrcMap;
  /** Feature flags — drive theme/language resolution on `srcMap`. */
  feature?: ImgFeature[];
  /** Alt text (pre-resolved from i18n).  Optional — the img may omit it. */
  alt?: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
  /** Additional CSS classes for the img element. */
  class?: string;
  /** fetchpriority attribute (e.g. "high" for hero images). */
  fetchpriority?: "high" | "low" | "auto";
  /** Native lazy loading. */
  loading?: "lazy" | "eager";
}

// -------------------------------------------------------------------------
// TypeAwareLink props
// -------------------------------------------------------------------------

/** Props for the TypeAwareLink component — smart link with type-aware behavior. */
export interface TypeAwareLinkProps {
  /** Target URL. */
  href: string;
  /** Link type — determines click behavior. */
  type: "external" | "internal" | "email" | "anchor";
  /** Optional FeatureAwarePicture props for the ExternalLinkConfirmModal. */
  pictureProps?: FeatureAwarePictureProps | null;
  /** Optional ColoredImg props for the ExternalLinkConfirmModal. */
  coloredProps?: ColoredImgProps | null;
  /** Hide the QR-code button in ExternalLinkConfirmModal. */
  noQRCode?: boolean;
  /** Hide the type indicator icon (arrow / envelope / paragraph). */
  hideIndicator?: boolean;
}

// =========================================================================
// GitHub API data
// =========================================================================

/**
 * Subset of GitHub's `GET /users/{username}` response.
 * Only includes fields that are displayed in the UI.
 */
export interface GitHubUser {
  /** GitHub login (username). */
  login: string;
  /** URL to the user's avatar image. */
  avatar_url: string;
  /** URL to the user's GitHub profile page. */
  html_url: string;
  /** Display name (may be null if not set). */
  name: string | null;
  /** User's bio / description. */
  bio: string | null;
  /** User's location. */
  location: string | null;
  /** Number of public repositories. */
  public_repos: number;
  /** Number of followers. */
  followers: number;
  /** Number of users the user is following. */
  following: number;
}

/** A single event from the GitHub Events API (GET /users/{username}/events/public). */
export interface GitHubEvent {
  /** Event id (may be absent in stale caches). */
  id?: string;
  /** Event type (e.g. "PushEvent", "WatchEvent"). */
  type: string;
  /** ISO 8601 timestamp of when the event was created. */
  created_at: string;
  /** Repository the event occurred on. */
  repo: {
    name: string;
  };
  /** Event-specific payload (shape varies by event type). */
  payload: {
    action?: string;
    /** PushEvent: total number of commits in the push. */
    size?: number;
    /** CreateEvent / DeleteEvent: "branch" or "tag". */
    ref_type?: string;
    /** IssueEvents / IssueCommentEvent: the referenced issue. */
    issue?: {
      number?: number;
      title?: string;
      html_url?: string;
    };
    [key: string]: unknown;
  };
}

/** Aggregated count for a single GitHub event type (used by bar chart). */
export interface ActivityStat {
  /** Raw event type string from the API (e.g. "PushEvent"). */
  eventType: string;
  /** Number of occurrences of this event type. */
  count: number;
  /** Percentage of total events (0–100). */
  percentage: number;
}

/** Daily event count data point for Chart.js time-series line chart. */
export interface DailyStat {
  /** UTC midnight as a millisecond timestamp. */
  x: number;
  /** Number of events on that day. */
  y: number;
}

// =========================================================================
// Modal stack
// =========================================================================

/** Props for ExternalLinkConfirmModal — stored in a modal-stack item. */
export interface ExternalLinkConfirmModalProps {
  /** External URL the user is about to visit. */
  url: string;
  /** Optional FeatureAwarePicture props for the link icon. */
  pictureProps: FeatureAwarePictureProps | null;
  /** Optional ColoredImg props for the link icon. */
  coloredProps: ColoredImgProps | null;
  /** Hide the "Show QR Code" button. */
  hideQR: boolean;
}

/** Props for QRCodeModal — stored in a modal-stack item. */
export interface QRCodeModalProps {
  /** URL encoded in the QR code. */
  url: string;
  /** Optional FeatureAwarePicture props for the centre overlay icon. */
  pictureProps: FeatureAwarePictureProps | null;
  /** Optional ColoredImg props for the centre overlay icon. */
  coloredProps: ColoredImgProps | null;
  /** Hide the "Open Link" button. */
  hideOpenLink: boolean;
}

/** Props for GitHubEventsModal — stored in a modal-stack item. */
export interface GitHubEventsModalProps {
  /** Modal title (event-type label or formatted date). */
  title: string;
  /** Filtered events to display, reverse chronological. */
  events: GitHubEvent[];
}

/** Props for PictureViewerModal — stored in a modal-stack item. */
export interface PictureViewerModalProps {
  /**
   * The group's pictures — the viewer navigates within this list
   * (prev/next, keyboard arrows, touch swipe).
   */
  contents: DisplayPictureData[];
  /** Id of the picture to display initially (deep-link target). */
  currentId: string;
}

/** Modal component identifiers in the modal stack. */
export type ModalId =
  | "external-link"
  | "qr-code"
  | "github-events"
  | "picture-viewer"
  | "settings"
  | "reset-warning";

/**
 * Modal stack entry — discriminated union keyed by `id`.
 * Narrowing `item.id` also narrows `item.props`.
 * `settings` and `reset-warning` are prop-less.
 */
export type ModalStackItem =
  | { id: "external-link"; props: ExternalLinkConfirmModalProps }
  | { id: "qr-code"; props: QRCodeModalProps }
  | { id: "github-events"; props: GitHubEventsModalProps }
  | { id: "picture-viewer"; props: PictureViewerModalProps }
  | { id: "settings"; props: null }
  | { id: "reset-warning"; props: null };

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
