/**
 * useGithubApi — GitHub REST API fetch + cache (thin wrapper).
 *
 * Delegates the stale-while-revalidate machinery to the shared
 * `useCachedFetch` core with the GitHub conventions: the `GitHub API`
 * error label and 403 (rate limit) keeping stale data.  All callers
 * using the same cache key share a single reactive ref and a single
 * in-flight fetch.
 */

import type { CacheAccessor } from "../../platform/storage";
import { useCachedFetch, type CachedFetchState } from "../core/useCachedFetch";

/**
 * GitHub REST API fetch + cache composable.
 *
 * **Stale-while-revalidate**: if cached data exists it is returned
 * immediately; if the cache is stale a background re-fetch is
 * triggered (but the stale data keeps showing).  Concurrent calls from
 * multiple components share a single in-flight fetch.
 *
 * On network error or HTTP 403 (rate limit), any cached data is
 * returned regardless of age.  If no cache exists, `data` stays null
 * and `error` is set.
 *
 * @param url - Full GitHub REST API URL (e.g. "https://api.github.com/users/stevehsudrawing").
 * @param cache - Storage accessor for this endpoint's cache
 *   (GITHUB_PROFILE_CACHE / GITHUB_EVENTS_CACHE / GITHUB_COMMITS_CACHE
 *   in platform/storage.ts).
 * @returns Reactive state ({@link CachedFetchState}) shared across all
 *          callers.
 *
 * @example
 * const { data, isLoading, error, refresh } = useGithubApi<GithubUser>(
 *   'https://api.github.com/users/stevehsudrawing',
 *   GITHUB_PROFILE_CACHE,
 * );
 */
export function useGithubApi<T>(
  url: string,
  cache: CacheAccessor<T>,
): CachedFetchState<T> {
  return useCachedFetch<T>(url, cache, {
    api: "github-rest",
    label: "GitHub API",
    staleStatuses: [403],
  });
}
