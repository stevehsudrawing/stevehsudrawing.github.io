---
description: >
  GitHub REST API integration: useGithubApi() generic fetch+cache composable (stale-while-revalidate,
  localStorage caching, 1-hour freshness, module-level singleton with request dedup),
  useGithubProfile() profile composable, useGithubActivity() events+stats composable,
  GitHubUserCard.vue (full/compact variants), GitHubActivityStatsCard.vue (horizontal bar chart).
  Use when: adding new GitHub API endpoints, modifying cache strategy, changing GitHub cards,
  or integrating with useGithubApi.
applyTo: >
  src/composables/useGithub*.ts;
  src/components/cards/GitHubUserCard.vue;
  src/components/cards/GitHubActivityStatsCard.vue;
  src/types/app.ts
---

#### 4.1.9 GitHub API Integration

##### 4.1.9.1 Architecture

```
useGithubApi<T>(url, cacheKey, maxAge?)    ← generic fetch + cache
  ├─ data: Ref<T | null>                   ← shared singleton per cacheKey
  ├─ isLoading: Ref<boolean>
  ├─ error: Ref<string | null>
  ├─ refresh(): Promise<void>              ← bypass cache, force re-fetch
  └─ internal: performFetch()              ← dedup via promiseCache

useGithubProfile()                         ← thin wrapper
  └─ useGithubApi<GitHubUser>(             ← for GET /users/stevehsudrawing
       PROFILE_URL,
       StorageKey.GithubProfile,
     )

useGithubActivity()                        ← events + computed stats
  ├─ useGithubApi<GitHubEvent[]>(          ← for GET /users/.../events/public
  │    EVENTS_URL,
  │    StorageKey.GithubEvents,
  │  )
  ├─ events: Ref<GitHubEvent[] | null>
  ├─ stats: Computed<ActivityStat[]>       ← sorted by count desc
  └─ eventTypeI18nKey(eventType)           ← exported helper for i18n label mapping

GitHubUserCard.vue                         ← Vue SFC
  ├─ variant="full"   : portrait card (avatar, bio, stats, link)
  └─ variant="compact": inline bar (avatar, stats, link)

GitHubActivityStatsCard.vue                ← Vue SFC
  └─ horizontal bar chart of event-type distribution
```

##### 4.1.9.2 Cache Strategy (stale-while-revalidate)

| Condition                         | Behavior                                          |
| --------------------------------- | ------------------------------------------------- |
| Cache exists + fresh (< 1h)       | Use cached data immediately, no network request   |
| Cache exists + stale (≥ 1h)       | Serve stale data, trigger background re-fetch     |
| No cache                          | Fetch immediately, show placeholder while loading |
| Fetch succeeds                    | Update cache + reactive ref                       |
| Fetch fails (network error)       | Keep cached data if available, set `error`        |
| Fetch fails (HTTP 403 rate limit) | Keep cached data regardless of age, set `error`   |
| SSR / no `window`                 | `readCache()` returns null, graceful no-op        |

**Cache keys**: `StorageKey.GithubProfile` (`"githubProfile"`), `StorageKey.GithubEvents` (`"githubEvents"`).
**Cache payload**: `{ data: T, fetchedAt: number }` (JSON).
**Max age**: 1 hour (3,600,000 ms), configurable via `useGithubApi`'s `maxAge` parameter.

##### 4.1.9.3 Singleton & Request Dedup

- **Module-level Maps** (`dataCache`, `loadingCache`, `errorCache`, `promiseCache`)
  keyed by cache key ensure all callers share the same reactive refs.
- **In-flight dedup**: if a fetch is already in progress for a cache key,
  subsequent `refresh()` or auto-fetch calls wait on the existing promise
  instead of issuing duplicate requests.

##### 4.1.9.4 GitHubActivityStatsCard — Event Type Bar Chart

Displays a horizontal bar chart of GitHub event type distribution.
Each bar shows the i18n label, proportional width, and numeric count.

**Data flow**:

1. `useGithubActivity()` fetches `/users/stevehsudrawing/events/public?per_page=100`
2. `stats` computed: counts each event type, skips `IssuesEvent` with `action: "labeled"` (duplicate of `"opened"`)
3. Card renders bars sorted by count descending

**i18n keys** (with fallbacks):

| Key                               | Fallback           | Usage                    |
| --------------------------------- | ------------------ | ------------------------ |
| `text-github-activity-stats`      | Recent Activity    | Heading when loading     |
| `text-x-events-total`             | %1 events          | Heading with total count |
| `text-github-activity-empty`      | No recent activity | Empty state              |
| `text-github-event-push`          | Commits            | PushEvent label          |
| `text-github-event-watch`         | Starred            | WatchEvent label         |
| `text-github-event-issues`        | Issues             | IssuesEvent label        |
| `text-github-event-issue-comment` | Comments           | IssueCommentEvent label  |
| `text-github-event-create`        | Created            | CreateEvent label        |
| `text-github-event-fork`          | Forked             | ForkEvent label          |
| `text-github-event-pull-request`  | Pull Requests      | PullRequestEvent label   |
| `text-github-event-delete`        | Deleted            | DeleteEvent label        |
| `text-github-event-other`         | (raw event type)   | Unknown event types      |

**Layout**: `h-100` card with `min-height: 220px`; in a Bootstrap row,
sits beside `GitHubUserCard` (also `h-100`) for equal-height columns.

##### 4.1.9.5 Adding a New GitHub API Endpoint

Create a thin wrapper composable following the `useGithubProfile` pattern:

```typescript
// src/composables/useGithubRepos.ts
import { useGithubApi, type GithubApiState } from "./useGithubApi";
import { StorageKey, type GitHubRepo } from "../types/app";

const REPOS_URL =
  "https://api.github.com/users/stevehsudrawing/repos?sort=updated";

export function useGithubRepos(): GithubApiState<GitHubRepo[]> {
  return useGithubApi<GitHubRepo[]>(REPOS_URL, StorageKey.GithubRepos);
}
```

Add the corresponding `StorageKey` value and response type in `types/app.ts`.

##### 4.1.9.6 GitHubUserCard Variants

| Variant   | Layout                                 | Used in                           |
| --------- | -------------------------------------- | --------------------------------- |
| `full`    | BCard with avatar, bio, stats, CTA     | SoftwaresPage "My GitHub Profile" |
| `compact` | Inline flexbar with avatar, stats, CTA | IndexPage Softwares section       |

##### 4.1.9.7 Consumers

| File                          | How                                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| `IndexPage.vue`               | `<GitHubUserCard variant="compact" />`                                                         |
| `SoftwaresPage.vue`           | `<GitHubUserCard variant="full" />` + `<GitHubActivityStatsCard />` in a `row > col-lg-6` grid |
| `GitHubUserCard.vue`          | `useGithubProfile()` → `{ data, isLoading }`                                                   |
| `GitHubActivityStatsCard.vue` | `useGithubActivity()` → `{ stats, isLoading }`                                                 |
