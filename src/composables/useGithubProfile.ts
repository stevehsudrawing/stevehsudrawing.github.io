/**
 * GitHub profile composable — thin wrapper around useGithubApi for
 * the `GET /users/stevehsudrawing` endpoint.
 *
 * All callers share a single cached ref via the generic useGithubApi
 * module-level singleton mechanism.  Cache freshness: 1 hour (default).
 */

import { useGithubApi, type GithubApiState } from "./useGithubApi";
import type { GitHubUser } from "../types/app";
import { GITHUB_USERNAME } from "../configs/page-meta";
import { GITHUB_PROFILE_CACHE } from "../platform/storage";

// =========================================================================
// Constants
// =========================================================================

/** GitHub REST API endpoint for the site owner's user profile. */
const PROFILE_URL = `https://api.github.com/users/${GITHUB_USERNAME}`;

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive GitHub user profile with stale-while-revalidate caching.
 *
 * @returns Shared reactive state for the site owner's GitHub profile.
 *
 * @example
 * const { data, isLoading, error, refresh } = useGithubProfile();
 * // data.value?.public_repos → 8
 */
export function useGithubProfile(): GithubApiState<GitHubUser> {
  return useGithubApi<GitHubUser>(PROFILE_URL, GITHUB_PROFILE_CACHE);
}
