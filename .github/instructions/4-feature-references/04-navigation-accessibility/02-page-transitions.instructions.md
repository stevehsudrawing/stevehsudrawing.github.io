---
description: >
  Page Navigation: Vue Router-based SPA navigation with createWebHistory,
  scrollBehavior with async hash polling, LoadingBar integration via router
  guards, ?lang= query preservation, and chunk-load-error fallback.
applyTo: >
  src/router.ts;
  src/App.vue
---

#### 4.4.2 Page Navigation (Vue Router)

##### 4.4.2.1 Architecture

Use Vue Router (`createWebHistory`) to manage browser history. Internal links
use `router.push()` intercepted by App.vue's delegated click handler.

```
App.vue (delegated click on .internal-link)
  └─ router.push(href)
       ├─ beforeEach: LoadingBar.show() (skipped same-page) + ?lang= preservation
       ├─ lazy import(page component)
       ├─ <router-view> renders component
       ├─ afterEach: LoadingBar.complete() (skipped same-page)
       └─ scrollBehavior: same-page query nav → false (keep scroll);
            hash → async polling (up to 20 rAF); else { top: 0 }
```

##### 4.4.2.2 Key Features

| Feature              | Implementation                                                       |
| -------------------- | -------------------------------------------------------------------- |
| URL bar updates      | `createWebHistory` — `history.pushState` on navigation               |
| Back/forward buttons | `createWebHistory` — native `popstate` handling                      |
| Progress bar         | `router.beforeEach` (show) + `router.afterEach` (complete)           |
| Hash scroll          | `scrollBehavior` — async `requestAnimationFrame` polling             |
| Same-page query nav  | `scrollBehavior` → `false` (keep scroll); LoadingBar/dimming skipped |
| Language persistence | `router.beforeEach` copies `?lang=` from `from` to `to`              |
| Chunk-load fallback  | `router.onError` — full `window.location.assign` on failure          |

##### 4.4.2.3 Known Issue: Edge + Vue Router Window Minimize

On Microsoft Edge (Windows / macOS), newer versions of Vue Router can
interfere with the browser's window-minimize operation. This is **not**
a CSS or GPU-compositing issue — it is a browser-level behavior in Edge.

**Root cause:** vue-router@4.6.3 added a `visibilitychange` listener
that fires too broadly, including during Vite HMR updates on a background
tab. When the tab regains visibility, `history.replaceState()` is called.
Edge (unlike Chrome) activates the window at the OS level in response to
`replaceState()`, making it difficult to minimize the window.

**References:**

- [vuejs/router#2644](https://github.com/vuejs/router/issues/2644) — Bug report
- [vuejs/router#2704](https://github.com/vuejs/router/pull/2704) — Fix (unmerged)
- [Microsoft Q&A](https://learn.microsoft.com/zh-cn/answers/questions/5792001/question-5792001)

> This was previously misattributed to `.theme-transition-overlay`
> backdrop-filter compositing. The actual cause is the
> visibilitychange → replaceState → window activation chain on Edge.

##### 4.4.2.4 Error Recovery

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
