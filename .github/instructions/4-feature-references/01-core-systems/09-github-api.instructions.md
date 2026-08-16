---
description: >
  GitHub REST API integration: useGithubApi() generic fetch+cache composable (stale-while-revalidate,
  storage-accessor caching via platform/storage.ts, 1-hour freshness, module-level singleton with
  request dedup),
  useGithubProfile() profile composable, useGithubActivity() events+stats composable,
  LoadingPlaceholder.vue (loading/error/empty), GitHubUserCard.vue (full/compact variants),
  GitHubActivityStatsCard.vue (Chart.js bar/line charts with external-icon labels).
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
useGithubApi<T>(url, cache, maxAge?)       ← generic fetch + cache (storage accessor)
  ├─ data: Ref<T | null>                   ← shared singleton per cacheKey
  ├─ isLoading: Ref<boolean>
  ├─ error: Ref<string | null>
  ├─ refresh(): Promise<void>              ← bypass cache, force re-fetch
  └─ internal: performFetch()              ← dedup via promiseCache

useGithubProfile()                         ← thin wrapper
  └─ useGithubApi<GitHubUser>(             ← for GET /users/stevehsudrawing
       PROFILE_URL,
       GITHUB_PROFILE_CACHE,
     )

useGithubActivity()                        ← events + computed stats
  ├─ useGithubApi<GitHubEvent[]>(          ← for GET /users/.../events/public
  │    EVENTS_URL,
  │    GITHUB_EVENTS_CACHE,
  │  )
  ├─ events: Ref<GitHubEvent[] | null>
  ├─ stats: Computed<ActivityStat[]>       ← sorted by count desc (bar chart)
  ├─ dailyStats: Computed<DailyStat[]>     ← daily aggregation (line chart)
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
  ├─ Chart.js bar  (indexAxis: "y")  — event-type distribution + external icon labels
  ├─ Chart.js line (time scale)      — daily event frequency
  └─ Toggle buttons with §4.2.6.1 delayed tooltips (destroy→recreate pattern)
```

> The site owner's GitHub username comes from `GITHUB_USERNAME` in
> `src/configs/site-meta.ts` — API URLs are built from it via template literals.

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

##### 4.1.9.3 `LoadingPlaceholder` — Three-State Component

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

##### 4.1.9.6 `GitHubUserCard` — Variants

| Variant   | Layout                                 | Used in                             |
| --------- | -------------------------------------- | ----------------------------------- |
| `full`    | BCard with avatar, bio, stats, CTA     | `SoftwaresPage` "My GitHub Profile" |
| `compact` | Inline flexbar with avatar, stats, CTA | `IndexPage` Softwares section       |

##### 4.1.9.7 `GitHubActivityStatsCard` — Chart.js Dual-Mode Visualization

Replaced the original hand-rolled CSS bars with Chart.js (v4.5+). Two chart
modes are available via toggle buttons in the card heading; the chart instance
is **destroyed and recreated** on every mode / data / theme change.

| Mode   | Chart.js config                  | Data source               |
| ------ | -------------------------------- | ------------------------- |
| `bar`  | `type: "bar"`, `indexAxis: "y"`  | `stats: ActivityStat[]`   |
| `line` | `type: "line"`, x-scale `"time"` | `dailyStats: DailyStat[]` |

**Bar mode — external icon labels (plan C)**:

Chart.js renders the horizontal bars with `y.ticks.display: false`. A
separate HTML flex column to the left displays the Bootstrap Icons + i18n
labels (`eventTypeIcon()` + `labelFor()`). The label column uses
`justify-content: space-around` to match Chart.js's category bar spacing.

```
┌─ chart-with-labels (flex) ───────────────────────────┐
│ ┌─ labels-col ───┐  ┌─ canvas-col (flex: 1) ───────┐ │
│ │ bi-git  Commits│  │ ████████████████████████████ │ │
│ │ bi-star Starred│  │ ██████████                   │ │
│ │ bi-excl Issues │  │ ████                         │ │
│ │ (placeholder)  │  │ (canvas: position: absolute) │ │
│ └────────────────┘  └──────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Line mode — daily frequency with zero-fill**:

`dailyStats` computes a full date range from `min(created_at)` to
`max(created_at)`, iterating every day. Days with no events get `y: 0`
so the line dips to zero instead of skipping (connecting across the gap).
x-axis uses `TimeScale` (requires `chartjs-adapter-date-fns`); y-axis
starts at zero with integer step size.

**Canvas sizing**: both chart containers use `position: relative` on the
wrapper and `position: absolute` on `<canvas>` to break the Chart.js ↔
flexbox resize feedback loop. The wrapper dimensions are determined by
`flex: 1; min-height: 0` within the `card-body` flex column.

**Theme-adaptive colours** are read via `cssVar()` from `platform/css-var.ts`
on every chart rebuild, ensuring light ↔ dark transitions take effect.
See §4.1.2.3 for the CSS variable naming convention.

**Toggle buttons** use `<TooltipTrigger>` (§4.2.6.1). Clicking destroys
the current chart and recreates it in the new mode.

**Click interaction -> events modal**:

Both chart modes push a `github-events` entry onto the modal stack
(§4.1.7) when an element is clicked:

| Mode   | Clicked element index maps to | Filter applied                         | Modal title          |
| ------ | ----------------------------- | -------------------------------------- | -------------------- |
| `bar`  | `stats[index].eventType`      | `e.type === eventType` (labeled dedup) | localized type label |
| `line` | `dailyStats[index].x` (ms)    | `e.created_at.slice(0,10) === dayStr`  | `YYYY-MM-DD`         |

Filtered events are sorted reverse-chronologically before pushing.
`onHover` sets `cursor: pointer` on hoverable elements via
`event.native?.target`. See `GitHubEventsModal.vue` for the list
rendering (icon + `%L` link-marker description + relative time via
date-fns locales).

**Event type icons and text** (via `eventTypeIcon()` / `eventTypeI18nKey()`):

| Event Type          | Icon                     | i18n Key                          |
| ------------------- | ------------------------ | --------------------------------- |
| `PushEvent`         | `bi-git`                 | `text-github-event-push`          |
| `WatchEvent`        | `bi-star-fill`           | `text-github-event-watch`         |
| `IssuesEvent`       | `bi-exclamation-diamond` | `text-github-event-issues`        |
| `IssueCommentEvent` | `bi-chat-left-dots`      | `text-github-event-issue-comment` |
| `CreateEvent`       | `bi-plus-circle`         | `text-github-event-create`        |
| `ForkEvent`         | `bi-diagram-2`           | `text-github-event-fork`          |
| `PullRequestEvent`  | `bi-signpost-split`      | `text-github-event-pull-request`  |
| `DeleteEvent`       | `bi-trash`               | `text-github-event-delete`        |
| (other)             | `bi-three-dots`          | `text-github-event-other`         |

**Relevant i18n keys** (beyond event-type labels):

| Key                                        | Fallback                            | Usage                      |
| ------------------------------------------ | ----------------------------------- | -------------------------- |
| `text-github-activity-stats`               | Recent Activity                     | Placeholder label          |
| `text-x-activities-recently`               | %1 activities recently              | Heading (%1 = total count) |
| `text-github-activity-empty`               | No recent activity                  | Empty state message        |
| `text-displaying-data-from-the-past-month` | displaying data from the past month | Subtitle                   |
| `text-bar-chart`                           | Bar chart                           | Bar toggle tooltip         |
| `text-line-chart`                          | Line chart                          | Line toggle tooltip        |
| `text-no-data-available`                   | No data available                   | Generic empty state        |

**Event-description templates** (used by `GitHubEventsModal` — `%L` marks
where the repo/issue `TypeAwareLink` is inserted, `%1` etc. are params):

| Key                              | Fallback                |
| -------------------------------- | ----------------------- |
| `text-event-desc-push`           | Pushed %1 commits to %L |
| `text-event-desc-push-plain`     | Pushed to %L            |
| `text-event-desc-watch`          | Starred %L              |
| `text-event-desc-fork`           | Forked %L               |
| `text-event-desc-issue-opened`   | Opened issue %L         |
| `text-event-desc-issue-closed`   | Closed issue %L         |
| `text-event-desc-issue-reopened` | Reopened issue %L       |
| `text-event-desc-issue-comment`  | Commented on %L         |
| `text-event-desc-create`         | Created %1 %L           |
| `text-event-desc-delete`         | Deleted %1 %L           |
| `text-event-desc-pr`             | %1 pull request %L      |

##### 4.1.9.8 Adding a New GitHub API Endpoint

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

##### 4.1.9.9 Consumers

| File                          | How                                                                                                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `IndexPage.vue`               | `<GitHubUserCard variant="compact" />`                                                                                                               |
| `SoftwaresPage.vue`           | `<GitHubUserCard variant="full" />` + `<GitHubActivityStatsCard />` in a `row > col-lg-6` grid                                                       |
| `GitHubUserCard.vue`          | `useGithubProfile()` → `{ data, isLoading, error }`; `LoadingPlaceholder` for loading/error/empty                                                    |
| `GitHubActivityStatsCard.vue` | `useGithubActivity()` → `{ events, stats, dailyStats, isLoading, error }`; Chart.js bar/line; chart clicks push `github-events` onto the modal stack |
| `GitHubEventsModal.vue`       | `useStackModal("github-events")`; icon + `%L` description + relative time (date-fns locales); links via `TypeAwareLink`                              |
| `LoadingPlaceholder.vue`      | Shared UI component — no composable dependency; receives `label`, `state`, detail props from parent                                                  |
