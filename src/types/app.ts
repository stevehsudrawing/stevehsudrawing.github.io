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
export type Breakpoint = "mobile" | "tablet" | "desktop" | "wide-desktop";

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

import type { HastNode } from "./hast";

/** Link-card descriptor — a single card with icon, link title, and description. */
export type LinkCardData =
  | {
      /** i18n key suffix: `t("text-" + id)` for the title text + icon alt. */
      id: string;
      /** Available (default) — the title is a link. */
      available?: true;
      /** Card icon — typed image (was `icon?: HastNode`). */
      icon?: TypeAwareImageProps;
      /** Title link (was `title?: HastNode`; renamed `titleLink`). */
      titleLink: TypeAwareLinkProps;
      /** Complex HAST — unchanged. */
      description?: HastNode | null;
    }
  | {
      /** i18n key suffix: `t("text-" + id)` for the title text + icon alt. */
      id: string;
      /** Unavailable — card is dimmed; the title renders as plain text. */
      available: false;
      /** Card icon — typed image (was `icon?: HastNode`). */
      icon?: TypeAwareImageProps;
      /** Complex HAST — unchanged. */
      description?: HastNode | null;
    };

/** Link-card group descriptor — a titled section containing multiple link cards. */
export interface LinkCardGroupData {
  /** i18n key suffix for the group title (`t("text-" + id)`). */
  id: string;
  /** HAST root node for the group description. */
  description?: HastNode | null;
  /** Array of link cards within this group. */
  contents: LinkCardData[];
}

/** Link-button descriptor for a single button in a button group. */
export interface LinkButtonData {
  /** i18n key suffix for the icon alt (`t("text-" + id)`). */
  id: string;
  /** Unified link (was `externalLink` + `linkHref`). */
  link: TypeAwareLinkProps;
  /** Icon — typed image (was `iconProps: HastProperties`, renamed). */
  icon: TypeAwareImageProps;
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
   * Unique id — i18n key suffix (`t("text-" + id + "-alt")`) for the
   * alt-text fallback and the lightbox deep-link target (`?preview=<id>`).
   */
  id: string;
  /**
   * FeatureAwarePictureProps for the poster.
   * `alt` is optional — when omitted the card/viewer falls back to
   * `t("text-" + id + "-alt")`.  width/height are omitted (masonry CSS
   * controls the layout) and `loading` defaults to lazy in the card
   * component.
   */
  pictureProps: FeatureAwarePictureProps;
  /** QR share-card centre overlay icon (picture or colored). */
  qrCodeIcon?: TypeAwareImageProps;
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
 * Language-keyed string (image src URL or markdown content) — keys derived
 * from `Lang`.  `en` is required — it is the ultimate fallback when a
 * language variant is not specified.
 */
export type LanguageAwareString = {
  en: string;
} & Partial<Record<Exclude<Lang, "en">, string>>;

/**
 * Theme-keyed image source map.
 * `light` is required — it is the ultimate fallback when a dark variant
 * is not specified.
 */
export interface ThemeAwareImgSrcMap {
  light: LanguageAwareString;
  dark?: LanguageAwareString;
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
// TypeAwareImage props
// -------------------------------------------------------------------------

/** A display image that is either a FeatureAwarePicture or a ColoredImg. */
export type TypeAwareImageProps =
  | { type: "picture"; imgProps: FeatureAwarePictureProps }
  | { type: "colored-img"; imgProps: ColoredImgProps };

// -------------------------------------------------------------------------
// Illustration carousel slide (IndexPage hero)
// -------------------------------------------------------------------------

/**
 * One slide descriptor of the IndexPage illustration carousel, rendered by
 * `IllustrationCarousel.vue` (Swiper v14).
 */
export interface IllustrationSlideData {
  /** Link type for `TypeAwareLink` (external / internal). */
  linkType: "external" | "internal";
  /** Destination href (external URL or internal page path). */
  href: string;
  /** Optional link icon shown for external links. */
  icon?: TypeAwareImageProps;
  /** i18n key of the image alt text (e.g. "text-illustration-0-alt"). */
  altKey: string;
  /** Multi-format source map for `FeatureAwarePicture`. */
  srcMap: PictureSrcMap;
  /** fetchpriority attribute (e.g. "high" for the first slide). */
  fetchpriority?: "high" | "low" | "auto";
  /** Native lazy loading. */
  loading?: "lazy" | "eager";
}

// -------------------------------------------------------------------------
// Sticker props (shared by StickerSection and StickerModal)
// -------------------------------------------------------------------------

/** Sticker descriptor shared by StickerSection and StickerModal. */
export interface StickerProps {
  /** Sticker filename stem — derives AVIF/WebP paths for light/dark. */
  stickerId: string;
  /** Optional plain-text line/caption below the sticker. */
  caption?: string;
}

// -------------------------------------------------------------------------
// Navbar item types (shared by AppNavbar and OffcanvasNav)
// -------------------------------------------------------------------------

/** A direct internal navbar link. */
export interface NavLinkItem {
  type: "link";
  href: string;
  i18nKey: string;
}

/** A navbar dropdown grouping internal page links (single level). */
export interface NavDropdownItem {
  type: "dropdown";
  i18nKey: string;
  children: NavLinkItem[];
}

/** A navbar entry: a direct link or a dropdown. */
export type NavItem = NavLinkItem | NavDropdownItem;

// -------------------------------------------------------------------------
// TypeAwareLink props
// -------------------------------------------------------------------------

/** Props for the TypeAwareLink component — smart link with type-aware behavior. */
export interface TypeAwareLinkProps {
  /** Target URL. */
  href: string;
  /** Link type — determines click behavior. */
  type: "external" | "internal" | "email" | "anchor";
  /** Optional icon for the ExternalLinkConfirmModal (external links). */
  icon?: TypeAwareImageProps | null;
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
  /** Optional icon for the link (picture or colored). */
  icon: TypeAwareImageProps | null;
  /** Hide the "Show QR Code" button. */
  hideQR: boolean;
}

/** Props for QRCodeModal — stored in a modal-stack item. */
export interface QRCodeModalProps {
  /** URL encoded in the QR code. */
  url: string;
  /** Optional centre overlay icon (picture or colored). */
  icon: TypeAwareImageProps | null;
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
  | "reset-warning"
  | "sticker";

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
  | { id: "reset-warning"; props: null }
  | { id: "sticker"; props: null };

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

/**
 * Injection key for the sticker modal.
 * Provided by App.vue; consumed by AboutPage.
 */
export const OPEN_STICKER_KEY = Symbol("openSticker");
