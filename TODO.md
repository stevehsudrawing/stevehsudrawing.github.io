# Vue 3 Migration TODO

> Last updated: 2026-08-04
>
> **Conventions for this document:**
>
> - `[x]` = done, `[ ]` = not started, `[~]` = in progress
> - Each phase must pass `pnpm typecheck` before moving to the next.
> - **PascalCase** for `.vue` files; **dash-case** for `.ts` / `.css` files.
> - Phase 7 merges SPA navigation + bridge elimination — doing them together avoids throwaway workarounds.

---

## Phase 0 - Vue 3 Shell ✅

> **Goal:** Introduce Vue 3 runtime + `bootstrap-vue-next` without breaking existing functionality.

- [x] Install `vue` + `bootstrap-vue-next` (dependencies)
- [x] Install `@vitejs/plugin-vue` + `unplugin-vue-components` (devDependencies)
- [x] Create `src/types/vue-shims.d.ts` - `.vue` module type declaration
- [x] Update `vite.config.ts`
  - [x] Add `vue()` plugin
  - [x] Add `Components({ resolvers: [BootstrapVueNextResolver()], dts: true, directives: true })`
- [x] Update `tsconfig.json` - add `src/**/*.vue` and `components.d.ts` to `include`
- [x] Create `src/App.vue`
  - [x] Migrate `DOMContentLoaded` handler to `<script setup>` `onMounted`
  - [x] Migrate `AppEvent.PageInitialized` listeners
  - [x] Template is empty for now (no visible UI in shell)
- [x] Rewrite `src/main.ts`
  - [x] Keep: CSS imports, global `window.*` exposures, module side-effect imports, early theme init
  - [x] Replace: `DOMContentLoaded` handler -> `createApp(App).mount("#app")`
- [x] Update 6 full-feature HTML pages (`index`, `about`, `artworks-and-videos`, `blogs-and-sponsor`, `chatting`, `softwares`)
  - [x] Add `<div id="app"></div>` after modals placeholder
  - [x] Add `<script type="module" src="./main.ts"></script>` before `</body>`
- [x] `pnpm typecheck` passes
- [x] `pnpm dev` starts successfully
- [x] **Verify in browser:** open `http://localhost:5173/` and spot-check all pages

---

## Phase 1 — Stylesheets Reorganization ✅

> Separated global CSS (`stylesheets/global/`) from component CSS (`stylesheets/components/`).
> Component CSS later migrated into `<style scoped>` blocks (Phase 4); folder deleted in Phase 5.

## Phase 2 — Composables Layer ✅

> Extracted reactive state from `core/` and `ui/` into Vue composables:
> `useLocalStorage.ts`, `useTheme.ts`, `useI18n.ts`. Coexists with legacy TS modules during migration.

## Phase 3 — Modal Components ✅

> Replaced 3 Bootstrap modals with `<BModal>` + `v-model`:
> `SettingsModal.vue`, `ExternalLinkConfirmModal.vue`, `QRCodeModal.vue`.
> Eliminated `ui/settings.ts`, `features/external-link-confirmation.ts`, `features/qr-code.ts`.

## Phase 4 — UI Components ✅

> Componentized 8 remaining `ui/*.ts` modules into Vue SFCs:
> `LoadingScreen.vue`, `LoadingBar.vue`, `ScrollHint.vue`, `CopyProtectedImg.vue`,
> `InlineSvg.vue`, `FeatureAwareImg.vue`, `AppNavbar.vue` + `OffcanvasNav.vue`, `FooterNav.vue`.
> Extracted `useSvgInjection.ts`, `useImgFeatures.ts`, `useImgDisplayProps.ts`, `useToast.ts` composables.
> All CSS migrated to `<style scoped>` or non-scoped `<style>` blocks.

## Phase 5 — Cleanup ✅

> Deleted `src/stylesheets/components/` and `build/page-components/`.
> Simplified `content-injection-plugin.ts` (removed page-component + language menu injection).
> Deleted dead files: `settings.ts`, `modal.ts`, `loading-screen.ts`, `external-link-confirmation.ts`, `qr-code.ts`.
> `window.bootstrap` and `@types/bootstrap` deferred (still used by tooltips/toast/page-transition).

## Phase 6 — Documentation Update ✅

> Restructured `.github/instructions/` to reflect Vue migration:
>
> - New `4-vue-component-conventions.instructions.md` (§3.4) — CSS taxonomy, bridge pattern, `<script setup>` conventions
> - `4-feature-references/` reorganized into 5 functional subdirectories (20 files, `####` headings with decimal numbering)
> - Updated `copilot-instructions.md` §0.4 (7-layer architecture) + §0.7 (Vue conventions quick ref)
> - Updated §1 (added Vue deps), §2 (Vue naming + fix broken links), §3 (expanded to composables/components)

---

## Target File Tree (Post-Phase 7)

> See below for the expected final state after Phase 7. `src/ui/` and
> `src/features/` directories are gone; all bridges eliminated; build-time
> HAST injection replaced by Vue components loaded at runtime.

### `src/`

```
src/
├── types/
│   ├── app.ts                          #   Lang, ThemeChoice, StorageKey, AppEvent
│   ├── css.d.ts                        #   CSS module declarations
│   ├── globals.d.ts                    #   (no more __xxx bridge types)
│   ├── hast.ts                         #   HAST node types
│   ├── vue-shims.d.ts                  #   .vue module declaration
│   └── vue-augment.d.ts                #   ComponentCustomProperties ($t)
│
├── core/
│   └── utils.ts                        #   Pure path/DOM helpers
│
├── composables/
│   ├── useI18n.ts                      #   locale + messages + setLocale()
│   ├── useImgDisplayProps.ts           #   HAST imgProperties extraction
│   ├── useImgFeatures.ts               #   colored masks + loading opacity
│   ├── useLocalStorage.ts              #   ref ↔ localStorage
│   ├── useSvgInjection.ts              #   injectSVG() + global scan
│   ├── useTheme.ts                     #   preference + effectiveTheme
│   └── useToast.ts                     #   SHOW_TOAST_KEY inject
│
├── plugins/
│   └── i18n.ts                         #   app.provide locale + messages; $t()
│
├── components/
│   ├── layout/
│   │   ├── AppNavbar.vue
│   │   ├── FooterNav.vue
│   │   └── OffcanvasNav.vue
│   ├── ui/
│   │   ├── CopyProtectedImg.vue
│   │   ├── FeatureAwareImg.vue
│   │   ├── InlineSvg.vue
│   │   ├── LoadingBar.vue
│   │   ├── LoadingScreen.vue
│   │   ├── ScrollHint.vue
│   │   └── ToastStack.vue
│   ├── modals/
│   │   ├── ExternalLinkConfirmModal.vue
│   │   ├── QRCodeModal.vue
│   │   ├── ResetWarningModal.vue
│   │   └── SettingsModal.vue
│   ├── cards/                          #   Phase 7: link card Vue components
│   │   ├── LinkCard.vue                #     Single card (icon + title + description)
│   │   ├── LinkCardGroup.vue           #     Single group (heading + description + cards)
│   │   └── LinkCardGroups.vue          #     Page-level (iterates GroupData[], <hr> separators)
│   └── buttons/                        #   Phase 7: link button Vue components
│       ├── LinkButton.vue              #     Single button (icon + label + tooltip)
│       └── LinkButtonGroup.vue         #     Container (maps LinkButton + .btn-group)
│
├── pages/                              #   Phase 7: Vue page components
│   ├── IndexPage.vue
│   ├── AboutPage.vue
│   ├── ArtworksPage.vue
│   ├── BlogsPage.vue
│   ├── ChattingPage.vue
│   └── SoftwaresPage.vue
│
├── stylesheets/global/
│   ├── accessibility.css
│   ├── base.css
│   ├── fonts.css
│   └── theme.css
│
├── configs/
│   ├── language-list.json              #   Runtime language list
│   ├── link-cards/                     #   → moved from build/configs/ (Phase 7)
│   └── link-button-groups/             #   → moved from build/configs/ (Phase 7)
│
├── App.vue
├── main.ts
└── index.html                          #   MPA entry (build-time SEO, runtime SPA nav)
```

### `build/`

```
build/
├── content-injection-plugin.ts         #   No-op pass-through (Phase 7)
├── head-tags-plugin.ts
├── minify-plugin.ts
├── sitemap-plugin.ts
├── page-meta.ts
├── types.ts
└── utils.ts
```

> **Note**: `build/configs/` eliminated in Phase 7. `page-meta.ts` moved
> to `build/` root. `language-list.json` already in `src/configs/` for
> runtime import. `link-cards/` and `link-button-groups/` JSON configs
> moved to `src/configs/` (Vue components load them at runtime).

### `public/`

```
public/
├── 404.html
├── error-javascript-disabled.html
├── error-unsupported-browser.html
├── llms.txt
├── manifest.json
├── robots.txt
├── configs/i18n/
│   ├── en.json
│   ├── zh-Hans.json
│   └── zh-Hant.json
├── images/
│   ├── avif/  ├── png/  ├── svg/  └── webp/
└── legacy/
    ├── base.css
    └── env-detection.js
```

**Key deletions from current state:**
`src/ui/` (bridges), `src/features/` (orchestration), `src/core/i18n.ts`,
`src/ui/theme.ts` (deferred), `src/*.html` (6 MPA pages — static content
moved to `src/pages/*.vue`), `window.bootstrap` (deferred),
`@types/bootstrap`, all `window.__xxx` bridge variables.

---

## Phase 7 — SPA Navigation + Legacy Bridge Elimination

> **Goal:** Replace MPA `page-transition.ts` (fetch + innerHTML swap) with
> Vue-native component switching, then eliminate all `window.__xxx` bridges
> and build-time HAST injection as a natural consequence.
>
> **Why together:** Bridges exist because legacy code (`page-transition.ts`,
> `page-content-initializer.ts`, `lang-switcher.ts`) needs to commandeer Vue
> components imperatively after DOM swap. Once navigation is Vue-native,
> components reinitialize via normal lifecycle — bridges become dead code
> automatically. Separating them produces throwaway workarounds.
>
> **MPA vs SPA:** Build-time MPA structure is preserved for SEO (each page
> gets its own `<head>` tags, sitemap entries, `<noscript>` fallback).
> Runtime navigation uses Vue Router with `createMemoryHistory` (not
> `createWebHistory`) so each MPA entry point initializes its own router
> instance — no shared state across page reloads.
>
> Vue Router justifies its ~8 kB (gzipped) cost by eliminating an entire
> class of bugs: history management, scroll restoration, query parameter
> preservation, navigation guards for LoadingBar integration, and
> `<router-link>` auto-active-class for navbar highlighting.

---

### 7.1 Before & After Architecture

```
BEFORE (current):                           AFTER (target):
─────────────                               ────────────
page-transition.ts                          App.vue
  fetch(url)                                  └─ <router-view v-slot="{ Component }">
  extractPageContent()                              <component :is="Component" />
  innerHTML swap                               │
  initPageContent() ──────────┐                ├─ IndexPage.vue  (lazy via import())
    ├─ updatePageText()       │                ├─ AboutPage.vue
    ├─ initAllTooltips()      │                ├─ ArtworksPage.vue
    ├─ initAllScrollHints() ──┤ bridge →      ├─ BlogsPage.vue
    ├─ initAllColoredImages() │  window.__xxx  ├─ ChattingPage.vue
    └─ ... 12 more calls      │                └─ SoftwaresPage.vue
                              │                   │
lang-switcher.ts ─────────────┘                   └─ onMounted:
  switchLang()                                       initCopyLinkBehavior()
    window.__loadingBar.show()                       initExternalLinkIndicators()

Navigation: page-transition.ts               Navigation: Vue Router
  click handler + pushState                    <router-link> + router.push()
  popstate listener                            router.beforeEach/afterEach guards
  manual fetch + parse                         (no fetch — components are local)
  scrollTo hash (manual)                       scrollBehavior() declarative
  loading bar (bridge)                         LoadingBar via guard → App.vue ref
  active nav-item (manual)                     <router-link> auto-active-class
```

---

### 7.2 Step A — Vue Page Components + Router Setup

**Create `src/pages/` with one component per route and configure Vue Router.**
Each component owns the unique static HTML currently in `<main id="page-content">`
of the corresponding `.html` file: the hero section (h1, intro paragraph, cover
image) plus any page-specific static markup.

> The `data-i18n` attributes on page content work via the existing i18n
> plugin — no special handling needed. The `<noscript>` fallback stays
> in each HTML entry point for SEO (Vue doesn't render without JS).

- [x] Install `vue-router` as a production dependency
- [x] Create `src/router.ts` — route definitions:
  ```ts
  const routes = [
    { path: "/", component: () => import("./pages/IndexPage.vue") },
    { path: "/about.html", component: () => import("./pages/AboutPage.vue") },
    {
      path: "/artworks-and-videos.html",
      component: () => import("./pages/ArtworksPage.vue"),
    },
    {
      path: "/blogs-and-sponsor.html",
      component: () => import("./pages/BlogsPage.vue"),
    },
    {
      path: "/chatting.html",
      component: () => import("./pages/ChattingPage.vue"),
    },
    {
      path: "/softwares.html",
      component: () => import("./pages/SoftwaresPage.vue"),
    },
  ];
  // Use createMemoryHistory so each MPA page gets its own router instance.
  // The initial entry is derived from window.location.pathname at load time.
  export const router = createRouter({
    history: createMemoryHistory(),
    routes,
  });
  ```
- [x] Create `src/pages/IndexPage.vue` (from `index.html` static content)
- [x] Create `src/pages/AboutPage.vue` (from `about.html` static content)
- [x] Create `src/pages/ArtworksPage.vue` (from `artworks-and-videos.html`)
- [x] Create `src/pages/BlogsPage.vue` (from `blogs-and-sponsor.html`)
- [x] Create `src/pages/ChattingPage.vue` (from `chatting.html`)
- [x] Create `src/pages/SoftwaresPage.vue` (from `softwares.html`)
- [x] Each page component imports its link-card data via `useLinkCards()`
      and renders `<LinkCardGroups>` directly (no Teleport needed)
- [x] Each page component imports its link-button-group data (see §7.4)
      and renders `<LinkButtonGroups>` directly (no `data-role` placeholder)
- [x] Remove the static page content from each `.html` file — replace
      `<main id="page-content">...</main>` with `<main id="page-content"></main>`
      (Vue will render into it via `<router-view>`)
- [x] `pnpm typecheck`

### 7.3 Step B — Vue Router Integration

**Replace `page-transition.ts` with Vue Router in App.vue.** Vue Router
handles URL → component mapping, history push/pop, scroll restoration,
and query parameter persistence — all of which `page-transition.ts`
implemented manually with edge-case bugs.

- [x] In `main.ts`, create and install the router plugin:
  ```ts
  import { router } from "./router";
  // ...
  const app = createApp(App);
  app.use(router);
  app.mount("#app");
  ```
- [x] In `App.vue` template, replace `#app` children with `<router-view>`:
  ```vue
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  ```
  (The `v-slot` wrapper lets us add `<Transition>` later if desired.)
- [~] Replace `<AppNavbar :current-page="currentPage">` with
  `<router-link>` — Bootstrap nav-items gain automatic `active` class:
  ```vue
  <router-link to="/" class="nav-link">Home</router-link>
  <router-link to="/about.html" class="nav-link">About</router-link>
  ```
  AppNavbar.vue no longer needs the `currentPage` prop.
- [x] Add `scrollBehavior` to router config for instant scroll-to-top
      and hash-target scroll:
  ```ts
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    }
    return { top: 0 };
  }
  ```
- [x] Add `router.beforeEach` / `router.afterEach` guards to drive
      LoadingBar (replaces `window.__loadingBar`):
  ```ts
  router.beforeEach(() => {
    loadingBarRef.value?.show();
  });
  router.afterEach(() => {
    loadingBarRef.value?.complete();
  });
  ```
  `loadingBarRef` is accessed via a shared module or `provide`/`inject`.
- [x] Preserve `?lang=` query parameter: add a `router.beforeEach` guard
      that copies `lang` from the current route to the target route if
      present (or use `router.resolve` with query merging)
- [x] Replace internal-link click handling: the existing `click` event
      listener on `a.internal-link` dispatches `router.push(href)` instead
      of calling `navigateTo(href)`. (Modifier-key + new-tab clicks are
      passed through without interception — Vue Router does not handle
      them, same as before.)
- [x] Replace `popstate` listener: Vue Router handles it natively via
      `createMemoryHistory`. Remove `initPageTransitionPopState()`.
- [x] `pnpm typecheck`

### 7.4 Step C — Link Button Groups Vue-ification

**Same pattern as link cards (§7.2 already lists them per page).**
Create Vue components that load JSON configs at runtime and render
Bootstrap button groups.

- [x] Create `src/components/buttons/LinkButton.vue`
  - Props: `button: LinkButtonData`
  - Renders `<a class="btn btn-outline-secondary">` with icon + label
  - `v-b-tooltip` for tooltip (replaces `data-bs-toggle="tooltip"`)
  - `data-link-img-props` for external-link confirmation modal
- [x] Create `src/components/buttons/LinkButtonGroup.vue`
  - Props: `group: LinkButtonGroupData`, `groupId: string`
  - Renders `.link-button-group` container with `<h2>` title + `<LinkButton>` list
- [x] Create `src/composables/useLinkButtonGroups.ts`
  - Dynamic `import()` per page name (like `useLinkCards`)
  - Returns `Ref<LinkButtonGroupData[] | null>`
- [x] Copy JSON configs from `build/configs/link-button-groups/` →
      `src/configs/link-button-groups/`
- [x] Each page component imports and renders `<LinkButtonGroup>` directly
- [x] `pnpm typecheck`

### 7.5 Step D — Bridge & Legacy Module Elimination

**With Steps A–C complete, bridges have zero consumers. Delete them.**

| Module                                 | Bridge                | Replaced by                                    |
| -------------------------------------- | --------------------- | ---------------------------------------------- |
| `ui/loading-bar.ts`                    | `window.__loadingBar` | Router guards (`beforeEach` / `afterEach`)     |
| `ui/scroll-hint.ts`                    | `window.__scrollHint` | `ScrollHint.vue` in page components            |
| `ui/no-copy.ts`                        | `window.__noCopy`     | `CopyProtectedImg.vue` (already done)          |
| `ui/navbar.ts`                         | `window.__navbar`     | `AppNavbar.vue` props (already done)           |
| `ui/tooltips.ts`                       | _(generic lifecycle)_ | `v-b-tooltip` directive (already done)         |
| `ui/toast.ts`                          | _(legacy export)_     | `useToast()` composable (already done)         |
| `features/page-transition.ts`          | —                     | Vue Router (`<router-link>` + `<router-view>`) |
| `features/page-content-initializer.ts` | —                     | Per-page `onMounted`                           |
| `features/lang-switcher.ts`            | —                     | Absorbed into `useI18n` composable             |

- [x] Delete `src/ui/loading-bar.ts` — remove `window.__loadingBar` type
- [x] Delete `src/ui/scroll-hint.ts` — remove `window.__scrollHint` type
- [x] Delete `src/ui/no-copy.ts` — remove `window.__noCopy` type
- [x] Delete `src/ui/navbar.ts` — remove `window.__navbar` type
- [x] Delete `src/ui/tooltips.ts`
- [x] Delete `src/ui/toast.ts`
- [x] Delete `src/features/page-transition.ts`
- [x] Delete `src/features/page-content-initializer.ts`
- [x] Migrate `features/lang-switcher.ts` `switchLang()` logic into
      `useI18n` composable; delete the file
- [x] Remove `@types/bootstrap` devDependency (`window.bootstrap` refs gone)
- [x] Remove `window.__xxx` type declarations from `src/types/globals.d.ts`
- [x] `pnpm typecheck`

### 7.6 Step E — Build System Cleanup

**Build-time HAST injection is dead.** Link cards and button groups are
now Vue components loaded at runtime. Clean up the leftovers.

- [x] Delete `build/builders/link-cards.ts`
- [x] Delete `build/builders/link-button-groups.ts`
- [x] Delete `build/configs/link-cards/` (already in `src/configs/link-cards/`)
- [x] Delete `build/configs/link-button-groups/` (already in `src/configs/`)
- [x] Simplify `content-injection-plugin.ts` — remove all `#links` and
      `data-role="link-button-group"` placeholder injection logic
- [x] Delete `build/configs/` directory (empty after above)
- [x] Move `build/configs/page-meta.ts` → `build/page-meta.ts`
- [x] Update imports in `head-tags-plugin.ts` and `sitemap-plugin.ts`
- [x] `pnpm typecheck`

### 7.7 Step F — Final Touches

- [x] Remove `AppEvent.PageInitialized` event — no more listeners
- [x] Remove `initPageTransitionLinkClicks` / `initPageTransitionPopState`
      from App.vue `onMounted` (replaced by Vue Router)
- [x] Remove `window.__loadingBar = loadingBarRef.value` etc. from
      App.vue `onMounted` (replaced by router guards)
- [x] Remove `initPageContent()` call from App.vue (replaced by per-page
      `onMounted` + `scrollBehavior`)
- [ ] Verify `LoadingBar` works via router guards (`beforeEach` shows,
      `afterEach` completes)
- [ ] Verify tooltips work on all link cards and button groups
      (already handled by `v-b-tooltip`)
- [ ] Verify copy-link behavior works (link anchors in group titles)
- [ ] Verify external-link confirmation modal works (data attributes on
      link cards and button groups)
- [ ] Verify QR code modal works
- [ ] Verify language switching works (absorbed into `useI18n`)
- [ ] Verify hash-based scroll works after navigation
- [ ] Verify scroll hints appear on link button groups
- [ ] Full manual QA on all 6 pages × 3 languages × 2 themes
- [ ] `pnpm typecheck && pnpm build`

### 7.8 Post-Phase 7 Target State

After Phase 7, the `src/` tree matches the Target File Tree at the top of
this document. The `src/ui/` and `src/features/` directories no longer
exist. All `window.__xxx` bridge variables are gone. `window.bootstrap`
is no longer referenced. Internal navigation is instantaneous Vue
component switching without page reload.
