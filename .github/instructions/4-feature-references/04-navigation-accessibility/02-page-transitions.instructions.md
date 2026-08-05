---
description: >
  Page Navigation: Vue Router-based SPA navigation with createWebHistory,
  scrollBehavior with async hash polling, LoadingBar integration via router
  guards, ?lang= query preservation, and chunk-load-error fallback.
  Replaces the legacy page-transition.ts fetch-based system (Phase 7).
applyTo: >
  src/router.ts;
  src/App.vue
---

#### 4.4.2 Page Navigation (Vue Router)

##### 4.4.2.1 Architecture

Phase 7 replaced the legacy `page-transition.ts` (fetch + innerHTML swap)
with Vue Router (`createWebHistory`). Internal links use `router.push()`
intercepted by App.vue's delegated click handler.

```
App.vue (delegated click on .internal-link)
  └─ router.push(href)
       ├─ beforeEach: LoadingBar.show() + ?lang= preservation
       ├─ lazy import(page component)
       ├─ <router-view> renders component
       ├─ afterEach: LoadingBar.complete()
       └─ scrollBehavior: async hash polling (up to 20 rAF)
```

##### 4.4.2.2 Key Features

| Feature              | Implementation                                              |
| -------------------- | ----------------------------------------------------------- |
| URL bar updates      | `createWebHistory` — `history.pushState` on navigation      |
| Back/forward buttons | `createWebHistory` — native `popstate` handling             |
| Progress bar         | `router.beforeEach` (show) + `router.afterEach` (complete)  |
| Hash scroll          | `scrollBehavior` — async `requestAnimationFrame` polling    |
| Language persistence | `router.beforeEach` copies `?lang=` from `from` to `to`     |
| Chunk-load fallback  | `router.onError` — full `window.location.assign` on failure |

##### 4.4.2.3 Error Recovery

If a lazy-loaded page chunk fails (network error, stale cache after
deployment), `router.onError` triggers a full browser navigation via
`window.location.assign(window.location.href)`. This mirrors the
old `page-transition.ts` fetch-failure fallback — the server serves
the correct `.html` entry point, which loads a fresh Vue app instance.

##### 4.4.2.4 Route Configuration

```ts
// src/router.ts
const routes = [
  {
    path: "/",
    alias: "/index.html",
    component: () => import("./pages/IndexPage.vue"),
  },
  { path: "/about.html", component: () => import("./pages/AboutPage.vue") },
  // ... 4 more page routes
];
```

No catch-all route — GitHub Pages serves `404.html` for unmatched paths.
