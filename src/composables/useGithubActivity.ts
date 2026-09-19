/**
 * GitHub activity composable — wraps useGithubApi for the Events API
 * and computes aggregated event-type statistics for the bar chart.
 *
 * Endpoint: GET /users/stevehsudrawing/events/public?per_page=100
 * Cache: 1-hour stale-while-revalidate (via useGithubApi).
 *
 * Deduplication: IssuesEvent with action "labeled" is skipped because
 * an "opened" event for the same issue is always present in the feed.
 *
 * Windowing: the feed is trimmed to the last 30 days client-side — the
 * Events API has no date parameter and can return stale entries despite
 * its documented 30-day window (a 2-year-old `PublicEvent` appeared in
 * the 2026-09-19 response).
 */

import { computed, type ComputedRef } from "vue";
import { GITHUB_USERNAME } from "../configs/site-meta";
import { GITHUB_EVENTS_CACHE } from "../platform/storage";
import {
  type ActivityStat,
  type DailyStat,
  type GitHubEvent,
} from "../types/app";
import type { IconName } from "../types/icons";
import { useGithubApi, type GithubApiState } from "./useGithubApi";

// =========================================================================
// Constants
// =========================================================================

/**
 * GitHub Events API endpoint for the site owner.
 *
 * The Events API accepts NO date parameter (only `per_page` / `page`),
 * so the rolling 30-day window is re-applied client-side — see
 * `filterRecentEvents()`.
 */
const EVENTS_URL = `https://api.github.com/users/${GITHUB_USERNAME}/events/public?per_page=100`;

/** Rolling activity window surfaced across the site (days). */
const ACTIVITY_WINDOW_DAYS = 30;

/** Rolling activity window (milliseconds). */
const ACTIVITY_WINDOW_MS = ACTIVITY_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// =========================================================================
// Helpers
// =========================================================================

/**
 * Trim an events feed to the rolling activity window.
 *
 * The Events API documents a 30-day window, yet real responses can
 * carry stale entries, so the window is enforced client-side. Events
 * with a missing or unparseable `created_at` are dropped.
 *
 * @param events - Raw events from the Events API.
 * @returns The events created within the last {@link ACTIVITY_WINDOW_DAYS} days.
 */
function filterRecentEvents(events: GitHubEvent[]): GitHubEvent[] {
  const threshold = Date.now() - ACTIVITY_WINDOW_MS;
  return events.filter((event) => {
    const timestamp = Date.parse(event.created_at);
    return !Number.isNaN(timestamp) && timestamp >= threshold;
  });
}

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
 * Map a GitHub event type string to its Material Symbols ligature name.
 *
 * @param eventType - Raw event type from the API (e.g. "PushEvent").
 * @returns Icon name for `MaterialSymbol` (e.g. "commit").
 */
export function eventTypeIcon(eventType: string): IconName {
  const map: Record<string, IconName> = {
    PushEvent: "commit",
    WatchEvent: "star",
    IssuesEvent: "error",
    IssueCommentEvent: "forum",
    CreateEvent: "add_circle",
    ForkEvent: "call_split",
    PullRequestEvent: "merge",
    DeleteEvent: "delete",
  };
  return map[eventType] || "more_horiz";
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive GitHub events with computed activity statistics.
 *
 * The returned `events` ref is the raw API feed trimmed to the last
 * {@link ACTIVITY_WINDOW_DAYS} days; both computed stat sets derive
 * from it.
 *
 * @returns Shared reactive state — events array, computed stats,
 *          loading/error flags, and a refresh trigger.
 *
 * @example
 * const { events, stats, isLoading } = useGithubActivity();
 * // stats.value → [{ eventType: "PushEvent", count: 20, percentage: 67 }, ...]
 */
export function useGithubActivity(): {
  /** Events of the last 30 days — the raw feed trimmed to the
   *  rolling window, or null if not yet fetched. */
  events: ComputedRef<GitHubEvent[] | null>;
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
    data: rawEvents,
    isLoading,
    error,
    refresh,
  } = useGithubApi<GitHubEvent[]>(EVENTS_URL, GITHUB_EVENTS_CACHE);

  // Public events ref — the raw feed trimmed to the rolling window
  const events = computed<GitHubEvent[] | null>(() =>
    rawEvents.value === null ? null : filterRecentEvents(rawEvents.value),
  );

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
