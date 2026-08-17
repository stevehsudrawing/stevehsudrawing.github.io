---
description: >
  Page navigation via usePageNavigation() composable: Vue Router guard orchestration
  (LoadingBar integration, content dimming, external-link indicators, page-title
  updates, ?lang= preservation).  Extracted from App.vue to keep the root shell lean.
  Use when: modifying router guards, navigation side-effects, or the navigation-loading flow.
applyTo: >
  src/composables/usePageNavigation.ts;
  src/App.vue
---

#### 4.1.6 Page Navigation

`usePageNavigation(router, loadingBarRef)` centralises all router-level
side effects that were previously inlined in App.vue's `<script setup>`.

##### 4.1.6.1 Guards Installed

| Guard        | Side Effect                                                              |
| ------------ | ------------------------------------------------------------------------ |
| `beforeEach` | `loadingBarRef.value?.show()` — skipped for same-page nav                |
| `afterEach`  | `loadingBarRef.value?.complete()` — skipped for same-page                |
| `beforeEach` | Add `.content-dimming` to `#page-content` (not first nav, not same-page) |
| `afterEach`  | Remove `.content-dimming` from `#page-content`                           |
| `afterEach`  | `updatePageTitle()`                                                      |
| `beforeEach` | Preserve `?lang=` query param from previous route                        |

Same-page navigations (`to.path === from.path`, e.g. `?preview=` / `?lang=`
changes) are soft — the LoadingBar and content dimming are skipped so
thumbnail clicks / prev / next / close stay silent. Scroll is preserved
too (`scrollBehavior` returns `false`, see §4.4.2).

##### 4.1.6.2 Why a Composable

- **Cohesion**: All navigation side effects live in one place.
- **Testability**: Router guards can be tested independently of App.vue.
- **Lean App.vue**: 5 `router.beforeEach`/`afterEach` blocks (~40 lines)
  collapse into a single line: `usePageNavigation(router, loadingBarRef)`.

##### 4.1.6.3 What Stays in App.vue

- i18n language loading used to integrate with the LoadingBar here; that
  integration was removed with the bundled-translations refactor
  (language switching is synchronous).
