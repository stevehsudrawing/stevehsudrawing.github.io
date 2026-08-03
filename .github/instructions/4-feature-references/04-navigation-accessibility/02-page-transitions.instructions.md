---
description: >
  Page Transitions: SPA-style animated navigation between internal pages (.internal-link),
  progress bar animation, content dimming, tooltip disposal before transition, i18n re-apply.
  page-transition.ts (legacy, coexists with Vue), page-transition.css (global).
  Use when: modifying page navigation, transition animations, or internal link behavior.
applyTo: >
  src/features/page-transition.ts;
  src/stylesheets/global/page-transition.css
---

#### 4.4.2 Page Transitions

##### 4.4.2.1 Architecture (Legacy)

`page-transition.ts` coexists with Vue. Initialized from `App.vue`'s `onMounted`
via `initPageTransitionLinkClicks()` and `initPageTransitionPopState()`.

##### 4.4.2.2 Flow

1. Click `.internal-link` -> intercepted
2. `showLoadingBar()` -> animate `#loading-bar` to 85%
3. `disposeAllTooltips()` -> prevent orphans
4. `fetch(newUrl)` -> parse HTML -> extract `<main>`
5. Replace `#page-content` innerHTML
6. `completeLoadingBar()` -> animate to 100%, fade
7. `initPageContent()` -> re-init i18n, tooltips, scroll hints, etc.
8. Dispatch `AppEvent.PageInitialized`

##### 4.4.2.3 CSS

`page-transition.css` (in `stylesheets/global/`) provides `.content-dimming`
and progress bar classes.

##### 4.4.2.4 Interaction with Vue

- `window.__loadingBar` bridge
- `AppEvent.PageInitialized` -> triggers `currentPage` update in App.vue
- `initPageContent()` re-applies Vue-independent DOM operations

##### 4.4.2.5 Future (Phase 7-8)

Will be replaced by Vue `<Transition>` or Vue Router.
