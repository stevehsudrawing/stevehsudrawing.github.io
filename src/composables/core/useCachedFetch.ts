/**
 * useCachedFetch — generic stale-while-revalidate fetch + cache.
 *
 * The shared core behind `useGithubApi()` and `useMinecraftProfile()`:
 * fetches a JSON endpoint and caches it in localStorage (through a
 * `CacheAccessor`), keyed by the accessor's storage key.  All callers
 * using the same key share one reactive ref and one in-flight fetch
 * (deduped via module-level promise tracking).
 *
 * Semantics: cached data is served immediately; a cache older than
 * `maxAge` triggers a background re-fetch while the stale data keeps
 * showing; on network errors — and on the configured `staleStatuses`
 * (e.g. rate limits) — cached data is returned regardless of age.
 */

import { ref, type Ref } from "vue";
import type { CacheAccessor } from "../../platform/storage";
import type { CachedApiId } from "../../types/app";

// =========================================================================
// Types
// =========================================================================

/** Return type for the useCachedFetch composable. */
export interface CachedFetchState<T> {
  /** The fetched (or cached) data, or null if never successfully fetched. */
  data: Ref<T | null>;
  /** True while a fetch is in-flight. */
  isLoading: Ref<boolean>;
  /** Error message from the last failed fetch, or null. */
  error: Ref<string | null>;
  /** Manually trigger a re-fetch (bypasses the freshness check). */
  refresh: () => Promise<void>;
  /** Full endpoint URL this state fetches (refresh-dialog transparency). */
  url: string;
  /** Cache timestamp of the current data, or null if never fetched. */
  fetchedAt: Ref<number | null>;
  /** Upstream API id — the `CACHED_APIS` metadata key. */
  api: CachedApiId;
}

/** Options accepted by the useCachedFetch composable. */
export interface CachedFetchOptions<T> {
  /** Upstream API id — the `CACHED_APIS` metadata key. */
  api: CachedApiId;
  /** Cache freshness threshold in milliseconds (default: 1 hour). */
  maxAge?: number;
  /** Label used in error messages (default: "API"). */
  label?: string;
  /**
   * HTTP statuses that keep stale data instead of surfacing an error
   * (rate limits — GitHub 403, playerdb 429).
   */
  staleStatuses?: readonly number[];
  /**
   * Maps the parsed response JSON to the cached shape before it is
   * stored and exposed (default: identity — the response as-is).
   */
  select?: (raw: unknown) => T;
}

// =========================================================================
// Shared state (module-level singletons keyed by cache key)
// =========================================================================

/** Default cache freshness threshold (1 hour in milliseconds). */
const DEFAULT_MAX_AGE = 3_600_000;

/** Default error-message label. */
const DEFAULT_LABEL = "API";

/** Singleton data refs keyed by cache key. */
const dataCache = new Map<string, Ref<unknown>>();

/** Singleton loading refs keyed by cache key. */
const loadingCache = new Map<string, Ref<boolean>>();

/** Singleton error refs keyed by cache key. */
const errorCache = new Map<string, Ref<string | null>>();

/** Singleton cache-timestamp refs keyed by cache key. */
const fetchedAtCache = new Map<string, Ref<number | null>>();

/** In-flight fetch promises keyed by cache key (dedup concurrent calls). */
const promiseCache = new Map<string, Promise<void>>();

// =========================================================================
// Composable
// =========================================================================

/**
 * Generic JSON fetch + cache composable.
 *
 * **Stale-while-revalidate**: if cached data exists it is returned
 * immediately; if the cache is older than `maxAge` a background
 * re-fetch is triggered (but the stale data keeps showing).  Concurrent
 * calls from multiple components share a single in-flight fetch.
 *
 * @param url - Full endpoint URL.
 * @param cache - Storage accessor for this endpoint's cache.
 * @param options - Upstream API id, freshness threshold, error label,
 *   stale statuses and the optional response `select` mapping.
 * @returns Reactive state ({@link CachedFetchState}) shared across all
 *          callers of the same cache key.
 *
 * @example
 * const { data, isLoading, error, refresh } = useCachedFetch<GithubUser>(
 *   "https://api.github.com/users/stevehsudrawing",
 *   GITHUB_PROFILE_CACHE,
 *   { api: "github-rest", label: "GitHub API", staleStatuses: [403] },
 * );
 */
export function useCachedFetch<T>(
  url: string,
  cache: CacheAccessor<T>,
  options: CachedFetchOptions<T>,
): CachedFetchState<T> {
  const context: FetchContext<T> = {
    url,
    cache,
    api: options.api,
    select: options.select,
    label: options.label ?? DEFAULT_LABEL,
    staleStatuses: options.staleStatuses ?? [],
  };
  const maxAge = options.maxAge ?? DEFAULT_MAX_AGE;
  const cacheKey = cache.key;

  // ---- Return the shared singleton if already initialised ----

  const existingData = dataCache.get(cacheKey);
  if (existingData) {
    return {
      data: existingData as Ref<T | null>,
      isLoading: loadingCache.get(cacheKey)! as Ref<boolean>,
      error: errorCache.get(cacheKey)! as Ref<string | null>,
      refresh: () => performFetch(context),
      url: context.url,
      fetchedAt: fetchedAtCache.get(cacheKey)!,
      api: context.api,
    };
  }

  // ---- First call: create the shared refs and trigger the initial fetch ----

  const data = ref<T | null>(null) as Ref<T | null>;
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const fetchedAt = ref<number | null>(null);

  dataCache.set(cacheKey, data);
  loadingCache.set(cacheKey, isLoading);
  errorCache.set(cacheKey, error);
  fetchedAtCache.set(cacheKey, fetchedAt);

  // Initialise from cache (synchronous)
  const cached = cache.read();
  if (cached) {
    data.value = cached.data;
    fetchedAt.value = cached.fetchedAt;
    // If stale, trigger a background refresh (stale data keeps showing)
    if (Date.now() - cached.fetchedAt > maxAge) {
      void performFetch(context);
    }
  } else {
    // No cache — fetch immediately
    void performFetch(context);
  }

  return {
    data,
    isLoading,
    error,
    refresh: () => performFetch(context),
    url: context.url,
    fetchedAt,
    api: context.api,
  };
}

// =========================================================================
// Internal fetch logic
// =========================================================================

/** Immutable per-endpoint context for {@link performFetch}. */
interface FetchContext<T> {
  /** Full endpoint URL. */
  url: string;
  /** Storage accessor for this endpoint's cache. */
  cache: CacheAccessor<T>;
  /** Upstream API id — the `CACHED_APIS` metadata key. */
  api: CachedApiId;
  /** Optional response-to-cached-shape mapping. */
  select?: (raw: unknown) => T;
  /** Label used in error messages. */
  label: string;
  /** HTTP statuses that keep stale data instead of erroring. */
  staleStatuses: readonly number[];
}

/**
 * Fetch the endpoint, update the cache and the shared reactive state.
 *
 * Deduplicates concurrent calls: if a fetch is already in-flight for
 * this endpoint, subsequent callers await the same promise.
 *
 * @param context - The endpoint's fetch context.
 */
async function performFetch<T>(context: FetchContext<T>): Promise<void> {
  const cacheKey = context.cache.key;

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
      const response = await fetch(context.url);

      if (!response.ok) {
        // Rate-limit statuses keep any cached data regardless of age
        if (context.staleStatuses.includes(response.status)) {
          if (error) {
            error.value = `${context.label} rate limit exceeded`;
          }
          return; // data stays at whatever cached value we have
        }
        if (error) {
          error.value = `${context.label} returned ${response.status} ${response.statusText}`;
        }
        return;
      }

      const raw = (await response.json()) as unknown;
      const value = context.select ? context.select(raw) : (raw as T);
      if (data) data.value = value;
      context.cache.write(value);
      const fetchedAt = fetchedAtCache.get(cacheKey);
      if (fetchedAt) fetchedAt.value = Date.now();
    } catch (err: unknown) {
      // Network error (or a throwing `select`) — keep cached data if any
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
