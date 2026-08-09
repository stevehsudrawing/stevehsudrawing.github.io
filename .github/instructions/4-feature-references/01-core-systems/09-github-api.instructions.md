---
description: >
  GitHub REST API integration: useGithubApi() generic fetch+cache composable (stale-while-revalidate,
  localStorage caching, 1-hour freshness, module-level singleton with request dedup),
  useGithubProfile() profile composable, GitHubUserCard.vue (full/compact variants).
  Use when: adding new GitHub API endpoints, modifying cache strategy, changing GitHubUserCard,
  or integrating with useGithubApi.
applyTo: >
  src/composables/useGithub*.ts;
  src/components/cards/GitHubUserCard.vue;
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

GitHubUserCard.vue                         ← Vue SFC
  ├─ variant="full"   : portrait card (avatar, bio, stats, link)
  └─ variant="compact": inline bar (avatar, stats, link)
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

**Cache key**: `StorageKey.GithubProfile` (`"githubProfile"` in localStorage).
**Cache payload**: `{ data: GitHubUser, fetchedAt: number }` (JSON).
**Max age**: 1 hour (3,600,000 ms), configurable via `useGithubApi`'s `maxAge` parameter.

##### 4.1.9.3 Singleton & Request Dedup

- **Module-level Maps** (`dataCache`, `loadingCache`, `errorCache`, `promiseCache`)
  keyed by cache key ensure all callers share the same reactive refs.
- **In-flight dedup**: if a fetch is already in progress for a cache key,
  subsequent `refresh()` or auto-fetch calls wait on the existing promise
  instead of issuing duplicate requests.

##### 4.1.9.4 Adding a New GitHub API Endpoint

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

##### 4.1.9.5 GitHubUserCard Variants

| Variant   | Layout                                 | Used in                          |
| --------- | -------------------------------------- | -------------------------------- |
| `full`    | BCard with avatar, bio, stats, CTA     | (future: About page, Index hero) |
| `compact` | Inline flexbar with avatar, stats, CTA | IndexPage Softwares section      |

##### 4.1.9.6 Consumers

| File                 | How                                          |
| -------------------- | -------------------------------------------- |
| `IndexPage.vue`      | `<GitHubUserCard variant="compact" />`       |
| `GitHubUserCard.vue` | `useGithubProfile()` → `{ data, isLoading }` |
