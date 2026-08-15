/**
 * GitHub activity composable — wraps useGithubApi for the Events API
 * and computes aggregated event-type statistics for the bar chart.
 *
 * Endpoint: GET /users/stevehsudrawing/events/public?per_page=100
 * Cache: 1-hour stale-while-revalidate (via useGithubApi).
 *
 * Deduplication: IssuesEvent with action "labeled" is skipped because
 * an "opened" event for the same issue is always present in the feed.
 */

import { computed, type ComputedRef } from "vue";
import { useGithubApi, type GithubApiState } from "./useGithubApi";
import {
  type GitHubEvent,
  type ActivityStat,
  type DailyStat,
} from "../types/app";
import { GITHUB_USERNAME } from "../configs/page-meta";
import { GITHUB_EVENTS_CACHE } from "../platform/storage";

// =========================================================================
// Constants
// =========================================================================

/** GitHub Events API endpoint for the site owner. */
const EVENTS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`;

// =========================================================================
// Helpers
// =========================================================================

/**
 * Map a GitHub event type string to its i18n key.
 *
 * @param eventType - Raw event type from the API (e.g. "PushEvent").
 * @returns i18n key for the human-readable label.
 */
export function eventTypeI18nKey(eventType: string): string {
  const map: Record<string, string> = {
    PushEvent: "text-github-event-push",
    WatchEvent: "text-github-event-watch",
    IssuesEvent: "text-github-event-issues",
    IssueCommentEvent: "text-github-event-issue-comment",
    CreateEvent: "text-github-event-create",
    ForkEvent: "text-github-event-fork",
    PullRequestEvent: "text-github-event-pull-request",
    DeleteEvent: "text-github-event-delete",
  };
  return map[eventType] || "text-github-event-other";
}

/**
 * Map a GitHub event type string to its Bootstrap Icons class.
 *
 * @param eventType - Raw event type from the API (e.g. "PushEvent").
 * @returns Bootstrap Icons CSS class (e.g. "bi-git").
 */
export function eventTypeIcon(eventType: string): string {
  const map: Record<string, string> = {
    PushEvent: "bi-git",
    WatchEvent: "bi-star",
    IssuesEvent: "bi-exclamation-diamond",
    IssueCommentEvent: "bi-chat-left-dots",
    CreateEvent: "bi-plus-circle",
    ForkEvent: "bi-diagram-2",
    PullRequestEvent: "bi-signpost-split",
    DeleteEvent: "bi-trash",
  };
  return map[eventType] || "bi-three-dots";
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive GitHub events with computed activity statistics.
 *
 * @returns Shared reactive state — events array, computed stats,
 *          loading/error flags, and a refresh trigger.
 *
 * @example
 * const { events, stats, isLoading } = useGithubActivity();
 * // stats.value → [{ eventType: "PushEvent", count: 20, percentage: 67 }, ...]
 */
export function useGithubActivity(): {
  /** Raw events from the API (or null if not yet fetched). */
  events: GithubApiState<GitHubEvent[]>["data"];
  /** Aggregated stats sorted by count descending. */
  stats: ComputedRef<ActivityStat[]>;
  /** Daily event counts for line chart (sorted by date ascending). */
  dailyStats: ComputedRef<DailyStat[]>;
  /** True while a fetch is in-flight. */
  isLoading: GithubApiState<GitHubEvent[]>["isLoading"];
  /** Error message from the last failed fetch, or null. */
  error: GithubApiState<GitHubEvent[]>["error"];
  /** Manually trigger a re-fetch. */
  refresh: GithubApiState<GitHubEvent[]>["refresh"];
} {
  const {
    data: events,
    isLoading,
    error,
    refresh,
  } = useGithubApi<GitHubEvent[]>(EVENTS_URL, GITHUB_EVENTS_CACHE);

  const stats = computed<ActivityStat[]>(() => {
    if (!events.value || events.value.length === 0) return [];

    // Count each event type, skipping noisy duplicates
    const counts: Record<string, number> = {};
    for (const event of events.value) {
      // "labeled" is a duplicate of "opened" for the same issue
      if (event.type === "IssuesEvent" && event.payload?.action === "labeled") {
        continue;
      }
      counts[event.type] = (counts[event.type] || 0) + 1;
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(counts)
      .map(([eventType, count]) => ({
        eventType,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  });

  const dailyStats = computed<DailyStat[]>(() => {
    if (!events.value || events.value.length === 0) return [];

    const map: Record<string, number> = {};
    for (const event of events.value) {
      if (event.type === "IssuesEvent" && event.payload?.action === "labeled") {
        continue;
      }
      const day = event.created_at.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    }

    const keys = Object.keys(map).sort();
    if (keys.length === 0) return [];

    // Build the full date range so days with zero events are
    // represented as { x, y: 0 } — Chart.js then dips to 0 instead
    // of connecting across the gap.
    const first = new Date(keys[0] + "T00:00:00Z");
    const last = new Date(keys[keys.length - 1] + "T00:00:00Z");

    const result: DailyStat[] = [];
    const cursor = new Date(first);
    while (cursor <= last) {
      const dayStr = cursor.toISOString().slice(0, 10);
      result.push({
        x: cursor.getTime(),
        y: map[dayStr] || 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return result;
  });

  return { events, stats, dailyStats, isLoading, error, refresh };
}
