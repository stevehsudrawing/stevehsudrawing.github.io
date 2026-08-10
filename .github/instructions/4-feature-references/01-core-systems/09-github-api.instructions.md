---
description: >
  GitHub REST API integration: useGithubApi() generic fetch+cache composable (stale-while-revalidate,
  localStorage caching, 1-hour freshness, module-level singleton with request dedup),
  useGithubProfile() profile composable, useGithubActivity() events+stats composable,
  LoadingPlaceholder.vue (loading/error/empty), GitHubUserCard.vue (full/compact variants),
  GitHubActivityStatsCard.vue (horizontal bar chart with icons).
  Use when: adding new GitHub API endpoints, modifying cache strategy, changing GitHub cards,
  or integrating with useGithubApi.
applyTo: >
  src/composables/useGithub*.ts;
  src/components/ui/LoadingPlaceholder.vue;
  src/components/cards/GitHub*.vue;
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
  ├─ eventTypeI18nKey(eventType)           ← exported helper: type → i18n key
  └─ eventTypeIcon(eventType)              ← exported helper: type → Bootstrap Icon class

LoadingPlaceholder.vue                     ← Vue SFC (src/components/ui/)
  ├─ state="loading" : spinner-border + label
  ├─ state="error"   : bi-x-circle-fill + label + errorMessage
  └─ state="empty"   : bi-slash-circle + label + emptyMessage

GitHubUserCard.vue                         ← Vue SFC
  ├─ variant="full"   : portrait BCard (avatar, bio, stats, CTA)
  └─ variant="compact": inline flexbar (avatar, stats, CTA)

GitHubActivityStatsCard.vue                ← Vue SFC
  └─ horizontal bar chart with Bootstrap Icons per event type
```

##### 4.1.9.2 Card Template Structure (Unified Placeholder Convention)

**Principle**: `LoadingPlaceholder` MUST be placed at the **`card-body` level**,
as a sibling of the data content — never outside it. This keeps the card shell
(`h-100`, borders, padding) stable across all states: loading, error, empty,
and data-present.

```
card
└── card-body (d-flex flex-column — always rendered)
    ├── <template v-if="hasData">          ← heading + content (only when data present)
    │   └── ...
    ├── <LoadingPlaceholder v-else-if="isLoading" state="loading" />
    ├── <LoadingPlaceholder v-else-if="error"     state="error"   />
    └── <LoadingPlaceholder v-else                state="empty"   />
```

Key rules:

- **`card-body` always renders**: do NOT put `v-if` on `card-body` itself.
- **Heading is part of content**: when loading/error/empty, the heading is
  hidden AND the `LoadingPlaceholder` label provides the context instead.
- **`h-100` goes on the outer card div**, not on `card-body`.
- For non-card layouts (e.g. `GitHubUserCard` compact variant), the same
  sibling pattern applies — `LoadingPlaceholder` replaces the bar content.

##### 4.1.9.3 LoadingPlaceholder — Three-State Component

| State     | Icon               | Color                 | Detail Prop    |
| --------- | ------------------ | --------------------- | -------------- |
| `loading` | `spinner-border`   | `text-primary`        | —              |
| `error`   | `bi-x-circle-fill` | `text-danger`         | `errorMessage` |
| `empty`   | `bi-slash-circle`  | `text-body-secondary` | `emptyMessage` |

Props: `label` (always shown below the icon), `state`, `errorMessage?`, `emptyMessage?`.
Uses `flex-grow-1` and `justify-content-center` to fill the parent card body.

##### 4.1.9.4 Cache Strategy (stale-while-revalidate)

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

##### 4.1.9.5 Singleton & Request Dedup

- **Module-level Maps** (`dataCache`, `loadingCache`, `errorCache`, `promiseCache`)
  keyed by cache key ensure all callers share the same reactive refs.
- **In-flight dedup**: if a fetch is already in progress for a cache key,
  subsequent `refresh()` or auto-fetch calls wait on the existing promise
  instead of issuing duplicate requests.

##### 4.1.9.6 GitHubActivityStatsCard — Event Type Bar Chart

Displays a horizontal bar chart of GitHub event type distribution.
Each bar shows a Bootstrap Icons icon, i18n label, proportional width fill,
and numeric count.

**Data flow**:

1. `useGithubActivity()` fetches `/users/stevehsudrawing/events/public?per_page=100`
2. `stats` computed: counts each event type, skips `IssuesEvent` with `action: "labeled"` (duplicate of `"opened"`)
3. Card renders bars sorted by count descending

**Event type icons** (via `eventTypeIcon()`):

| Event Type          | Icon                     |
| ------------------- | ------------------------ |
| `PushEvent`         | `bi-git`                 |
| `WatchEvent`        | `bi-star-fill`           |
| `IssuesEvent`       | `bi-exclamation-diamond` |
| `IssueCommentEvent` | `bi-chat-left-dots`      |
| `CreateEvent`       | `bi-plus-circle`         |
| `ForkEvent`         | `bi-diagram-2`           |
| `PullRequestEvent`  | `bi-signpost-split`      |
| `DeleteEvent`       | `bi-trash`               |
| (other)             | `bi-three-dots`          |

**Layout**: CSS Grid `grid-template-columns: auto 1fr auto` so all labels
share the width of the widest label, bars fill remaining space, and counts
auto-size. `h-100` card; in a Bootstrap row sits beside `GitHubUserCard`
(also `h-100`) for equal-height columns.

**i18n keys** (with fallbacks):

| Key                                        | Fallback                            | Usage                                         |
| ------------------------------------------ | ----------------------------------- | --------------------------------------------- |
| `text-github-activity-stats`               | Recent Activity                     | LoadingPlaceholder label                      |
| `text-x-events-total`                      | %1 events                           | Heading with total count (%1 = N)             |
| `text-github-activity-empty`               | No recent activity                  | Empty state message                           |
| `text-displaying-data-from-the-past-month` | displaying data from the past month | Subtitle in heading bar                       |
| `text-github-event-push`                   | Commits                             | PushEvent label                               |
| `text-github-event-watch`                  | Starred                             | WatchEvent label                              |
| `text-github-event-issues`                 | Issues                              | IssuesEvent label                             |
| `text-github-event-issue-comment`          | Comments                            | IssueCommentEvent label                       |
| `text-github-event-create`                 | Created                             | CreateEvent label                             |
| `text-github-event-fork`                   | Forked                              | ForkEvent label                               |
| `text-github-event-pull-request`           | Pull Requests                       | PullRequestEvent label                        |
| `text-github-event-delete`                 | Deleted                             | DeleteEvent label                             |
| `text-github-event-other`                  | (raw event type)                    | Unknown event types                           |
| `text-no-data-available`                   | No data available                   | Generic empty state message                   |
| `text-loading`                             | Loading…                            | (deprecated — use LoadingPlaceholder instead) |

##### 4.1.9.7 Adding a New GitHub API Endpoint

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

When building a new card component, follow the **unified placeholder convention**
([§4.1.9.2](#4192-card-template-structure-unified-placeholder-convention)):
placeholders at `card-body` level, heading hidden during non-data states.

##### 4.1.9.8 GitHubUserCard Variants

| Variant   | Layout                                 | Used in                           |
| --------- | -------------------------------------- | --------------------------------- |
| `full`    | BCard with avatar, bio, stats, CTA     | SoftwaresPage "My GitHub Profile" |
| `compact` | Inline flexbar with avatar, stats, CTA | IndexPage Softwares section       |

##### 4.1.9.9 Consumers

| File                          | How                                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `IndexPage.vue`               | `<GitHubUserCard variant="compact" />`                                                                                |
| `SoftwaresPage.vue`           | `<GitHubUserCard variant="full" />` + `<GitHubActivityStatsCard />` in a `row > col-lg-6` grid                        |
| `GitHubUserCard.vue`          | `useGithubProfile()` → `{ data, isLoading, error }`; `LoadingPlaceholder` for loading/error/empty                     |
| `GitHubActivityStatsCard.vue` | `useGithubActivity()` → `{ stats, isLoading, error }`; `eventTypeIcon()` for icons; `LoadingPlaceholder` for non-data |
| `LoadingPlaceholder.vue`      | Shared UI component — no composable dependency; receives `label`, `state`, detail props from parent                   |
