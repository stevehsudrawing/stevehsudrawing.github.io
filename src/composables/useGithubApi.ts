/**
 * Generic GitHub REST API composable with client-side caching.
 *
 * Provides a **stale-while-revalidate** fetch + localStorage cache for any
 * GitHub API endpoint.  All callers using the same cache key share a single
 * reactive ref and a single in-flight fetch (deduped via module-level
 * promise tracking).
 *
 * Cache entries are stored as `{ data, fetchedAt }` JSON objects under
 * the given cache key.  The `maxAge` option controls freshness (default:
 * 1 hour).  Stale caches are served immediately while a background
 * re-fetch runs; on network error or 403 (rate-limit), cached data is
 * returned regardless of age.
 */

import { ref, type Ref } from "vue";

// =========================================================================
// Types
// =========================================================================

/** Wrapper stored in localStorage alongside each API response. */
interface CacheEntry<T> {
  /** The API response data. */
  data: T;
  /** `Date.now()` when the data was fetched. */
  fetchedAt: number;
}

/** Return type for the useGithubApi composable. */
export interface GithubApiState<T> {
  /** The fetched data, or null if never successfully fetched. */
  data: Ref<T | null>;
  /** True while a fetch is in-flight. */
  isLoading: Ref<boolean>;
  /** Error message from the last failed fetch, or null. */
  error: Ref<string | null>;
  /** Manually trigger a re-fetch (bypasses cache freshness check). */
  refresh: () => Promise<void>;
}

// =========================================================================
// Shared state (module-level singletons keyed by cacheKey)
// =========================================================================

/** Default cache freshness threshold (1 hour in milliseconds). */
const DEFAULT_MAX_AGE = 3_600_000;

/** Singleton data refs keyed by cache key. */
const dataCache = new Map<string, Ref<unknown>>();

/** Singleton loading refs keyed by cache key. */
const loadingCache = new Map<string, Ref<boolean>>();

/** Singleton error refs keyed by cache key. */
const errorCache = new Map<string, Ref<string | null>>();

/** In-flight fetch promises keyed by cache key (dedup concurrent calls). */
const promiseCache = new Map<string, Promise<void>>();

// =========================================================================
// Helpers
// =========================================================================

/**
 * Attempt to read a cached entry from localStorage.
 *
 * @param cacheKey - localStorage key for this API endpoint.
 * @returns The parsed cache entry, or null if not found / corrupted.
 */
function readCache<T>(cacheKey: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw === null) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    // Basic guard: ensure the parsed object has the expected shape
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

/**
 * Write a cache entry to localStorage.
 *
 * @param cacheKey - localStorage key for this API endpoint.
 * @param data - The API response data to cache.
 */
function writeCache<T>(cacheKey: string, data: T): void {
  if (typeof window === "undefined") return;

  const entry: CacheEntry<T> = {
    data,
    fetchedAt: Date.now(),
  };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch {
    // localStorage full or disabled — silently ignore
  }
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Generic GitHub API fetch + cache composable.
 *
 * **Stale-while-revalidate**: if cached data exists it is returned
 * immediately; if the cache is older than `maxAge` a background re-fetch
 * is triggered (but the stale data keeps showing).  Concurrent calls
 * from multiple components share a single in-flight fetch.
 *
 * On network error or HTTP 403 (rate limit), any cached data is returned
 * regardless of age.  If no cache exists, `data` stays `null` and `error`
 * is set.
 *
 * @param url - Full GitHub REST API URL (e.g. "https://api.github.com/users/stevehsudrawing").
 * @param cacheKey - localStorage key for this endpoint's cache.
 * @param maxAge - Cache freshness threshold in ms (default: 1 hour).
 * @returns Reactive state ({@link GithubApiState}) shared across all callers.
 *
 * @example
 * const { data, isLoading, error, refresh } = useGithubApi<GitHubUser>(
 *   'https://api.github.com/users/stevehsudrawing',
 *   'githubProfile',
 * );
 */
export function useGithubApi<T>(
  url: string,
  cacheKey: string,
  maxAge: number = DEFAULT_MAX_AGE,
): GithubApiState<T> {
  // ---- Return cached singleton if already initialised ----

  const existingData = dataCache.get(cacheKey);
  if (existingData) {
    return {
      data: existingData as Ref<T | null>,
      isLoading: loadingCache.get(cacheKey)! as Ref<boolean>,
      error: errorCache.get(cacheKey)! as Ref<string | null>,
      refresh: () => performFetch(cacheKey, url, maxAge),
    };
  }

  // ---- First call: create shared refs and trigger initial fetch ----

  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  dataCache.set(cacheKey, data);
  loadingCache.set(cacheKey, isLoading);
  errorCache.set(cacheKey, error);

  // Initialise from cache (synchronous)
  const cached = readCache<T>(cacheKey);
  if (cached) {
    data.value = cached.data;
    // If stale, trigger background refresh
    if (Date.now() - cached.fetchedAt > maxAge) {
      void performFetch(cacheKey, url, maxAge);
    }
  } else {
    // No cache — fetch immediately
    void performFetch(cacheKey, url, maxAge);
  }

  return {
    data,
    isLoading,
    error,
    refresh: () => performFetch(cacheKey, url, maxAge),
  };
}

// =========================================================================
// Internal fetch logic
// =========================================================================

/**
 * Fetch data from the given URL, update cache and reactive state.
 *
 * Deduplicates concurrent calls: if a fetch is already in-flight for
 * `cacheKey`, subsequent callers wait on the same promise.
 *
 * @param cacheKey - localStorage key for this endpoint's cache.
 * @param url - GitHub REST API URL.
 * @param maxAge - Cache freshness threshold in ms (not used here, but
 *   carried for potential future use in background refresh logic).
 */
async function performFetch<T>(
  cacheKey: string,
  url: string,
  maxAge: number,
): Promise<void> {
  // Dedup: if a fetch is already in-flight, piggyback on it
  const existing = promiseCache.get(cacheKey);
  if (existing) {
    await existing;
    return;
  }

  const isLoading = loadingCache.get(cacheKey) as Ref<boolean> | undefined;
  const error = errorCache.get(cacheKey) as Ref<string | null> | undefined;
  const data = dataCache.get(cacheKey) as Ref<T | null> | undefined;

  if (isLoading) isLoading.value = true;
  if (error) error.value = null;

  const promise = (async (): Promise<void> => {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        // 403 = rate limited; keep any cached data regardless of age
        if (response.status === 403) {
          if (error) error.value = "GitHub API rate limit exceeded";
          return; // data stays at whatever cached value we have
        }
        if (error) {
          error.value = `GitHub API returned ${response.status} ${response.statusText}`;
        }
        return;
      }

      const json = (await response.json()) as T;
      if (data) data.value = json;
      writeCache(cacheKey, json);
    } catch (err: unknown) {
      // Network error — keep cached data if we have it
      if (error) {
        error.value =
          err instanceof Error ? err.message : "Unknown network error";
      }
    } finally {
      if (isLoading) isLoading.value = false;
      promiseCache.delete(cacheKey);
    }
  })();

  promiseCache.set(cacheKey, promise);
  await promise;
}
