/**
 * GitHub commits composable — wraps useGithubApi for the repository
 * commits endpoint (the site changelog modal).
 *
 * Endpoint: GET /repos/{GITHUB_REPO}/commits?per_page=10
 * Cache: 1-hour stale-while-revalidate (via useGithubApi).
 *
 * Lazy contract: the changelog modal is always mounted, so it must
 * NOT call this at page load.  The modal calls it on its first open;
 * the shared cache then serves reopens instantly.
 */

import { GITHUB_REPO } from "../configs/site-meta";
import { GITHUB_COMMITS_CACHE } from "../platform/storage";
import type { GitHubCommit } from "../types/app";
import { useGithubApi, type GithubApiState } from "./useGithubApi";

// =========================================================================
// Constants
// =========================================================================

/** Latest commits of the site repository (10 rows for the modal). */
const COMMITS_URL = `https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=10`;

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive latest-commits state for the site changelog modal.
 *
 * @returns Shared reactive state — the commits array, loading/error
 *          flags, and a refresh trigger.
 *
 * @example
 * const { commits, isLoading, error, refresh } = useGithubCommits();
 */
export function useGithubCommits(): {
  /** Latest commits (newest first), or null if not yet fetched. */
  commits: GithubApiState<GitHubCommit[]>["data"];
  /** True while a fetch is in-flight. */
  isLoading: GithubApiState<GitHubCommit[]>["isLoading"];
  /** Error message from the last failed fetch, or null. */
  error: GithubApiState<GitHubCommit[]>["error"];
  /** Manually trigger a re-fetch. */
  refresh: GithubApiState<GitHubCommit[]>["refresh"];
} {
  const { data, isLoading, error, refresh } = useGithubApi<GitHubCommit[]>(
    COMMITS_URL,
    GITHUB_COMMITS_CACHE,
  );
  return { commits: data, isLoading, error, refresh };
}
