/**
 * Storage platform module — the single entry point for ALL localStorage
 * access in the application.
 *
 * MANDATORY CONSTRAINT (see §3.1 / §4.1.3): every localStorage key MUST
 * have a typed getter/setter accessor pair here.  Raw localStorage usage
 * outside this module is forbidden.
 *
 * Conventions:
 * - String preferences (theme, lang) -> stored as plain strings
 * - Boolean preferences              -> stored as "true" / "false"
 * - Cached API data                  -> stored as JSON (CacheEntry<T>)
 * - All accessors validate on read and fail closed to a safe default.
 */

import { DEFAULT_LANG, LANGUAGE_LIST } from "../configs/language-list";
import type { GitHubEvent, GitHubUser, Lang, ThemeChoice } from "../types/app";
import { StorageKey } from "../types/app";

// =========================================================================
// Low-level primitives (private)
// =========================================================================

/** Read a raw string value; null when missing or storage is unavailable. */
function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    // localStorage disabled (private mode) — treat as missing
    return null;
  }
}

/** Write a raw string value, swallowing storage errors (quota/private mode). */
function writeRaw(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

// =========================================================================
// Cache entry types (shared with useGithubApi)
// =========================================================================

/** Wrapper stored in localStorage alongside each API response. */
export interface CacheEntry<T> {
  /** The API response data. */
  data: T;
  /** `Date.now()` when the data was fetched. */
  fetchedAt: number;
}

/** Accessor pair for one GitHub API cache key. */
export interface GithubCacheAccessor<T> {
  /** StorageKey string — identity for useGithubApi's singleton maps. */
  key: string;
  /** Read the cache entry (null on miss / corruption). */
  read: () => CacheEntry<T> | null;
  /** Persist freshly fetched data with a new timestamp. */
  write: (data: T) => void;
}

// =========================================================================
// Theme
// =========================================================================

/** Valid theme choices — the single source of truth (also used by theme.ts). */
export const SUPPORTED_THEMES: readonly string[] = ["auto", "light", "dark"];

/** Read the stored theme preference (default: "auto"). */
export function getStoredTheme(): ThemeChoice {
  const raw = readRaw(StorageKey.Theme);
  return raw !== null && SUPPORTED_THEMES.includes(raw)
    ? (raw as ThemeChoice)
    : "auto";
}

/** Persist the theme preference. */
export function setStoredTheme(choice: ThemeChoice): void {
  if (SUPPORTED_THEMES.includes(choice)) {
    writeRaw(StorageKey.Theme, choice);
  }
}

// =========================================================================
// Language
// =========================================================================

/** Read the stored language code (default: DEFAULT_LANG). */
export function getStoredLang(): Lang {
  const raw = readRaw(StorageKey.Lang);
  const match = LANGUAGE_LIST.find((lang) => lang.code === raw);
  return match ? match.code : DEFAULT_LANG;
}

/** Persist the language preference (canonical codes only). */
export function setStoredLang(lang: Lang): void {
  if (LANGUAGE_LIST.some((entry) => entry.code === lang)) {
    writeRaw(StorageKey.Lang, lang);
  }
}

// =========================================================================
// Boolean preferences
// =========================================================================

/** Read the open-in-new-tab preference (default: true). */
export function getStoredOpenInNewTab(): boolean {
  const raw = readRaw(StorageKey.OpenInNewTab);
  return raw === "true" ? true : raw === "false" ? false : true;
}

/** Persist the open-in-new-tab preference. */
export function setStoredOpenInNewTab(value: boolean): void {
  writeRaw(StorageKey.OpenInNewTab, value ? "true" : "false");
}

/** Read the enable-animations preference (default: true). */
export function getStoredEnableAnimations(): boolean {
  const raw = readRaw(StorageKey.EnableAnimations);
  return raw === "true" ? true : raw === "false" ? false : true;
}

/** Persist the enable-animations preference. */
export function setStoredEnableAnimations(value: boolean): void {
  writeRaw(StorageKey.EnableAnimations, value ? "true" : "false");
}

// =========================================================================
// GitHub API caches
// =========================================================================

/** Read a JSON cache entry for one GitHub cache key. */
function readCacheEntry<T>(key: string): CacheEntry<T> | null {
  const raw = readRaw(key);
  if (raw === null) return null;
  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (
      !entry ||
      typeof entry.fetchedAt !== "number" ||
      entry.data === undefined
    ) {
      return null;
    }
    return entry;
  } catch {
    // Corrupted JSON — treat as cache miss
    return null;
  }
}

/** Write a JSON cache entry for one GitHub cache key. */
function writeCacheEntry<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, fetchedAt: Date.now() };
  writeRaw(key, JSON.stringify(entry));
}

/** GitHub profile cache accessor for useGithubApi(). */
export const GITHUB_PROFILE_CACHE: GithubCacheAccessor<GitHubUser> = {
  key: StorageKey.GithubProfile,
  read: (): CacheEntry<GitHubUser> | null =>
    readCacheEntry<GitHubUser>(StorageKey.GithubProfile),
  write: (data: GitHubUser): void => {
    writeCacheEntry(StorageKey.GithubProfile, data);
  },
};

/** GitHub events cache accessor for useGithubApi(). */
export const GITHUB_EVENTS_CACHE: GithubCacheAccessor<GitHubEvent[]> = {
  key: StorageKey.GithubEvents,
  read: (): CacheEntry<GitHubEvent[]> | null =>
    readCacheEntry<GitHubEvent[]>(StorageKey.GithubEvents),
  write: (data: GitHubEvent[]): void => {
    writeCacheEntry(StorageKey.GithubEvents, data);
  },
};
