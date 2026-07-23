/**
 * Application-wide shared types.
 * Centralises string literal types, enums, and constants
 * that are used across multiple modules.
 */

// =========================================================================
// String literal types
// =========================================================================

/** Supported language codes. */
export type Lang = 'en' | 'zh-Hans' | 'zh-Hant';

/** User-selectable theme choices. */
export type ThemeChoice = 'auto' | 'light' | 'dark';

/** Effective (resolved) theme — always light or dark. */
export type EffectiveTheme = 'light' | 'dark';

// =========================================================================
// localStorage keys
// =========================================================================

export const enum StorageKey {
    Theme = 'bsTheme',
    Lang = 'preferredLang',
    OpenInNewTab = 'openExternalLinksInNewTab',
    EnableAnimations = 'enableAnimations',
}

// =========================================================================
// CustomEvent names
// =========================================================================

export const enum AppEvent {
    PageTextUpdated = 'pageTextUpdated',
    PageInitialized = 'pageInitialized',
}
