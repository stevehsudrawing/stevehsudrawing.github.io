# Vue 3 Migration TODO

> Last updated: 2026-08-02
>
> **Conventions for this document:**
>
> - `[x]` = done, `[ ]` = not started, `[~]` = in progress
> - Each phase must pass `pnpm typecheck` before moving to the next.
> - **PascalCase** for `.vue` files; **dash-case** for `.ts` / `.css` files.
> - Multi-page app (MPA) stays for now; SPA deferred to Phase 6.

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
  - [x] Replace: `DOMContentLoaded` handler → `createApp(App).mount("#app")`
- [x] Update 6 full-feature HTML pages (`index`, `about`, `artworks-and-videos`, `blogs-and-sponsor`, `chatting`, `softwares`)
  - [x] Add `<div id="app"></div>` after modals placeholder
  - [x] Add `<script type="module" src="./main.ts"></script>` before `</body>`
- [x] `pnpm typecheck` passes
- [x] `pnpm dev` starts successfully
- [x] **Verify in browser:** open `http://localhost:5173/` and spot-check all pages

---

## Phase 1 - Stylesheets Reorganization ✅

> **Goal:** Separate global CSS from component-scoped CSS. Component CSS will eventually
> migrate into `<style scoped>` blocks inside `.vue` files; global CSS stays in `stylesheets/`.

### 1.1 Create folder structure

```
src/stylesheets/
├── global/                          # Never migrating - always global
│   ├── base.css                     #   :root, body, Bootstrap overrides
│   ├── theme.css                    #   --shlh-* variables, [data-bs-theme]
│   ├── fonts.css                    #   @font-face, font stacks
│   └── accessibility.css            #   prefers-reduced-*, .user-input-keyboard, .skip-to-content
│
└── components/                      # Temporary - will migrate to Vue <style scoped>
    ├── navbar.css                   #   → AppNavbar.vue
    ├── scroll-hint.css              #   → ScrollHint.vue
    ├── loading-screen.css           #   → LoadingScreen.vue
    ├── loading-bar.css              #   → LoadingBar.vue
    ├── page-transition.css          #   → Vue <Transition> classes
    ├── qr-code.css                  #   → QRCodeModal.vue
    ├── img-utils.css                #   → ThemeAwareImg.vue
    ├── external-link-confirmation.css  # → ExternalLinkConfirmModal.vue
    ├── no-copy.css                  #   → CopyProtectedImg.vue
    └── components.css               #   → split into individual components or shared global fragments
```

### 1.2 Tasks

- [x] Create `src/stylesheets/global/` directory
- [x] Create `src/stylesheets/components/` directory
- [x] Move `base.css` → `stylesheets/global/base.css`
- [x] Move `theme.css` → `stylesheets/global/theme.css`
- [x] Move `fonts.css` → `stylesheets/global/fonts.css`
- [x] Move `accessibility.css` → `stylesheets/global/accessibility.css`
- [x] Move remaining 10 CSS files → `stylesheets/components/`
- [x] Update import paths in `src/main.ts` (14 lines)
- [x] Update import paths in `src/main-lightweight.ts`
- [x] `pnpm typecheck`
- [x] `pnpm dev` - verify visual appearance unchanged

---

## Phase 2 - Composables Layer ✅

> **Goal:** Extract reactive state from `core/` and `ui/` modules into Vue composables.
> Existing imperative modules keep working; composables sit alongside them until consumers are migrated.

### 2.1 Prerequisite composable

- [x] Create `src/composables/useLocalStorage.ts`
  - Reactive `ref<T>` that auto-syncs with `localStorage`
  - Handles legacy plain-string values (try/catch `JSON.parse` fallback)

### 2.2 Theme composable

- [x] Create `src/composables/useTheme.ts`
  - `preference` ref (auto / light / dark, synced to `StorageKey.Theme`)
  - `effectiveTheme` computed (resolves "auto" → system preference)
  - `setPreference(choice)` delegates to `ui/theme.ts` for overlay + DOM
  - System theme listener via `matchMedia` in `onMounted` / `onUnmounted`
- [x] Wire `useTheme` into `App.vue` (coexists with existing init*() imports)
- [x] Keep `ui/theme.ts` in place for `main-lightweight.ts` consumers until that page is migrated
- [x] `pnpm typecheck`

### 2.3 I18n composable + plugin

- [x] Create `src/plugins/i18n.ts` - Vue plugin
  - Provide `locale` ref + `messages` ref via `app.provide`
  - Register `$t(key, fallback?)` global method
- [x] Create `src/composables/useI18n.ts`
  - `t(key, fallback?)` function (reads from provided `messages`)
  - `setLocale(rawLang)` async function (fetch JSON → update `messages` + call `applyLangData`)
- [x] Wire `i18n` plugin into `main.ts` (`app.use(i18nPlugin)`)
- [x] Wire `useI18n` into `App.vue` (coexists with existing `initLang()`)
- [x] Keep `core/i18n.ts` in place for `main-lightweight.ts` consumers
- [x] `pnpm typecheck`

---

## Phase 3 - Modal Components ✅

> **Goal:** Replace 3 manually-managed Bootstrap modals with `<BModal>` + `v-model`.
> This eliminates `ui/settings.ts`, `features/external-link-confirmation.ts`, and `features/qr-code.ts`.

### 3.1 Settings Modal

- [x] Create `src/components/modals/SettingsModal.vue`
  - `<BModal v-model="visible">` - replaces `new bootstrap.Modal(...)`
  - Theme selector: active state via `:class` - replaces `.theme-item` event delegation
  - Language selector: `<select v-model="locale">` - replaces `#language-select` event delegation
  - New-tab toggle: `<BFormCheckbox v-model="openInNewTab" switch>` - replaces `#external-links-new-tab-toggle`
  - Animations toggle: `<BFormCheckbox v-model="enableAnimations" switch :disabled="reducedMotion">`
  - Reset with inline confirmation - replaces nested `#warning-reset-modal`
  - Expose `show()` / `hide()` via `defineExpose`
- [x] Wire `SettingsModal` into `App.vue`
- [x] Remove `initSettingEventListeners()`, `initSettingsModal()`, `initModalFocusManagement()` calls from `App.vue`
- [x] Keep `ui/settings.ts` in place for other consumers (SPA re-init)
- [x] `pnpm typecheck`

### 3.2 External Link Confirmation Modal

- [x] Create `src/components/modals/ExternalLinkConfirmModal.vue`
  - `props: { url, imgProperties?, hideQRButton? }`
  - `<BModal>` with "Open" / "Copy" / "Show QR" / "Cancel" footer buttons
  - `<BFormCheckbox v-model="openInNewTab" switch>` synced via `useLocalStorage`
  - Emit `navigate`, `show-qr` events
- [x] Wire into `App.vue` - replaces `initExternalLinkConfirmation()` + delegated click handler
- [x] Keep `features/external-link-confirmation.ts` in place for other consumers
- [x] `pnpm typecheck`

### 3.3 QR Code Modal

- [x] Create `src/components/modals/QRCodeModal.vue`
  - `props: { url, imgProperties?, hideOpenLink? }`
  - QR code canvas generation via `qrcode` library
  - Center overlay icon rendering
  - Download-as-PNG via `html-to-image` (with `html2canvas` fallback)
  - Share via Web Share API, copy image to clipboard
- [x] Wire into `App.vue` - replaces `initQRCodeDelegation()` + delegated click handler
- [x] Keep `features/qr-code.ts` in place for other consumers (SPA re-init)
- [x] `pnpm typecheck`

---

## Phase 4 - UI Components

> **Goal:** Componentize remaining `ui/*.ts` modules and migrate corresponding CSS
> from `stylesheets/components/` into `<style scoped>` blocks.
>
> **Ordered easiest → hardest:**

### 4.1 Loading Screen ⭐ ✅

- [x] Create `src/components/ui/LoadingScreen.vue`
  - Static HTML in each page for instant display (no flash)
  - Vue component manages fade-out lifecycle via `defineExpose({ hide })`
  - CSS migrated from `loading-screen.css` to non-scoped `<style>` block
- [x] Remove `ui/loading-screen.ts` + `stylesheets/components/loading-screen.css` imports
- [x] `pnpm typecheck`

### 4.2 Loading Bar ⭐ ✅

- [x] Create `src/components/ui/LoadingBar.vue`
  - Controls static HTML `#page-transition-progress` (injected via header.html)
  - Reactive `show()` / `complete()` / `hide()` via `defineExpose`
  - CSS migrated from `loading-bar.css` to non-scoped `<style>` block
- [x] Rewrite `ui/loading-bar.ts` as bridge → delegates to `window.__loadingBar`
- [x] Remove `stylesheets/components/loading-bar.css` import
- [x] `pnpm typecheck`

### 4.3 Scroll Hint ⭐ ✅

- [x] Create `src/components/ui/ScrollHint.vue`
  - Controls `.link-button-group` hint elements (build-time injected HTML)
  - Exposes `createHint` / `removeHint` / `updateAllHints` / `initAllHints`
  - CSS migrated from `scroll-hint.css` to non-scoped `<style>` block
  - Resize listener lifecycle managed via `onBeforeUnmount`
- [x] Rewrite `ui/scroll-hint.ts` as bridge → delegates to `window.__scrollHint`
- [x] Remove `stylesheets/components/scroll-hint.css` import
- [x] `pnpm typecheck`

### 4.4 Copy-Protected Image ⭐ ✅

- [x] Create `src/components/ui/CopyProtectedImg.vue`
  - Document-level event delegation (contextmenu + dragstart)
  - Self-initializing on mount, cleanup on unmount
  - CSS migrated from `no-copy.css` to non-scoped `<style>` block
- [x] Rewrite `ui/no-copy.ts` as bridge → delegates to `window.__noCopy` with generic fallback
- [x] Remove `initNoCopyProtection()` call from `App.vue` (component handles it)
- [x] Remove `stylesheets/components/no-copy.css` import
- [x] **404 demotion (§4.4a):** `src/404.html` → `public/404.html` (static error page)
  - Removed `main-lightweight.ts` (66 lines) — last consumer of lightweight tier
  - Removed `"lightweight"` from `PageTier` type; simplified `head-tags-plugin.ts`
  - Deleted `build/page-components/footer-lightweight.html`
  - Simplified `no-copy.ts` bridge (no more lightweight-specific path)
- [x] `pnpm typecheck`

### 4.5 Tooltips ⭐⭐ ✅

- [x] **Phase A: Extract copy-link → `src/ui/copy-link.ts`**
  - `handleCopyLinkClick`, `initCopyLinkClick`, `disposeCopyLinkClick` — clipboard + Toast
  - `initCopyLinkTooltip`, `disposeCopyLinkTooltip` — tooltip decoration (desktop only)
  - `initAllCopyLinkBehavior` — batch init
- [x] Prune `ui/tooltips.ts` — keep generic tooltip lifecycle + i18n listener only
- [x] Update `features/page-content-initializer.ts` — split import across two modules
- [ ] **Phase B (deferred):** Replace `createTooltip`/`disposeTooltip` with `v-b-tooltip` for Vue-rendered elements (build-time elements still need `initAllTooltips`)
- [x] `pnpm typecheck`

### 4.6 Toast Notifications ✅

- [x] Create `src/components/ui/ToastStack.vue`
  - `<BToast>` with reactive `toasts[]` array
  - `<TransitionGroup>` for enter/leave animations
  - `showToast()` exposed via `provide`/`inject` + `useToast()` composable
- [x] Fix `ExternalLinkConfirmModal.copyUrl()` — now shows success/error toast
- [x] Fix `QRCodeModal` — replaces 3 dynamic `import("../../ui/toast.js")` calls with `useToast()`
- [ ] Keep `ui/toast.ts` in place for legacy SPA re-init consumers
- [x] `pnpm typecheck`

### 4.7 Inline SVG ⭐⭐⭐ ✅

- [x] Create `src/components/ui/InlineSvg.vue`
  - **Dual-mode**: Vue template `<InlineSvg src="..." :width="25" />` + global `initAll()` scan
  - Props: `src`, `width?`, `height?`, `colorVar?`
  - Replaces `<span data-role="svg" data-src="..." ...>` in `QRCodeModal.vue`
- [x] Rewrite `ui/svg-utils.ts` as bridge → delegates to `window.__svgInjection`
- [x] Remove `stylesheets/components/` (no CSS file for svg-utils)
- [x] `pnpm typecheck`

### 4.8 Theme-Aware Image ⭐⭐⭐ ✅

- [x] Create `src/components/ui/FeatureAwareImg.vue` (renamed from `ThemeAwareImg`)
  - **Three features**: `follow-theme` (src swap), `colored` (CSS mask), `loading-opacity` (fade on load)
  - Vue template: `<FeatureAwareImg light-src="..." feature="colored" color-var="..." color-mask-src="..." />`
  - Global scan: `initAll()` processes build-time `[data-img-feature]` images
  - CSS migrated from `img-utils.css` to non-scoped `<style>` block
- [x] Replace `<img>` in `QRCodeModal.vue` + `ExternalLinkConfirmModal.vue` with `<FeatureAwareImg>`
  - Pass through all HAST properties: `dataImgFeature` → `feature`, `dataColorVar` → `colorVar`, `dataSrcMask` → `colorMaskSrc`
- [x] Rewrite `ui/img-utils.ts` as hybrid bridge (single-element ops direct + batch ops delegate)
- [x] Remove `stylesheets/components/img-utils.css` import
- [x] `pnpm typecheck`

### 4.9 Navbar ⭐⭐⭐⭐⭐ ✅

- [x] Create `src/components/layout/AppNavbar.vue` — one-shot Vue render (no bridge controller)
  - Active item highlighting → `:class` computed from `normalizeInternalPath()`
  - `<BDropdown>` for theme + language — replaces `initDropdownMenuAnimation()`
  - Mobile brand scroll swap → `@scroll` + `brandProgress` computed
  - Scroll border → `@scroll` + `:class="scrolled"`
  - CSS migrated from `navbar.css` (250 lines) → `<style scoped>`
- [x] Create `src/components/layout/OffcanvasNav.vue` — mobile sidebar
  - `props: { navItems }` — shared link data
  - Bootstrap offcanvas via `data-bs-toggle` (no JS needed)
- [x] Rewrite `ui/navbar.ts` as bridge → `window.__navbar` (26 lines, down from 230)
- [x] Update `build/page-components/header.html` — removed `<nav>`, kept overlay/progress/skip-button
- [x] Remove `<div data-role="page-component" data-component-name="header|footer">` from 6 HTML pages
- [x] Remove `stylesheets/components/navbar.css` + `.no-copy.css` imports
- [x] `pnpm typecheck`

### 4.10 Footer ⭐⭐ ✅

- [x] Create `src/components/layout/FooterNav.vue` — replaces `build/page-components/footer.html`
  - Copyright with internal link (`/about.html`, i18n, `v-b-tooltip`)
  - "Powered by Vite" external link (`data-link-img-props`, `data-no-qr-code`)
  - "Report an Issue" / "Artwork Copyright" — external links with `colored` icons
  - "Share this website!" — QR trigger (`data-qr-url` + `data-qr-icon` + `v-b-tooltip`)
  - "View Code" — external link with `colored` icon + `v-b-tooltip`
  - CSS from `base.css` `.footer` → `<style scoped>`
- [x] Delete `build/page-components/footer.html`
- [x] `pnpm typecheck`

---

## Phase 5 - Cleanup

> **Goal:** Remove dead code after all consumers have been migrated.

- [ ] Delete `src/stylesheets/components/` folder (all CSS migrated to `<style scoped>`)
- [ ] Delete `build/page-components/` folder — all components now Vue SFCs:
  - `header.html` → `AppNavbar.vue` + `OffcanvasNav.vue`
  - `footer.html` → `FooterNav.vue`
  - `footer-lightweight.html` → already deleted (§4.4a)
  - `modals.html` → already commented out (§3.1–§3.3)
- [ ] Simplify `build/content-injection-plugin.ts` — remove page component injection logic
  - No more `data-role="page-component"` placeholders to resolve
  - `readPageComponent()` and related walk logic can be removed
  - Link card / link button group injection stays (build-time HAST → not yet Vue-ified)
- [ ] Remove `window.bootstrap` global exposure in `main.ts` (no longer needed - `bootstrap-vue-next` handles all JS behavior)
- [ ] Remove `@types/bootstrap` from `devDependencies` (if bootstrap JS is no longer needed)
- [ ] Audit remaining `src/ui/*.ts` and `src/features/*.ts` files - delete any that have no remaining consumers
- [ ] `pnpm typecheck` - ensure zero errors
- [ ] `pnpm build` - verify production build succeeds

---

## Phase 6 - Documentation Update

> **Goal:** Update project instruction files (`.github/instructions/`) to reflect
> the Vue migration patterns, conventions, and architecture decisions.
> Status: deferred — execute after Phase 5 cleanup is complete.

### 6.1 Vue Component Annotation Conventions

Add to `.github/instructions/` a new file documenting the CSS and bridge
patterns established during Phase 3–4 migration.

#### A. CSS Style Block Taxonomy

| Style block               | Use case                                                                                                                                     | Example                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `<style scoped>`          | Styles owned entirely by one `.vue` component                                                                                                | Modal layout, QR share card, toast animations           |
| `<style>` (non-scoped)    | Component owns the CSS but the target element is static HTML outside Vue's render tree                                                       | `#page-transition-progress`, `.scroll-hint`, `.no-copy` |
| `:deep(.selector)`        | Target elements inside a child component (e.g. BModal's `.modal-body`)                                                                       | `:deep(.modal-body) { display: flex; }`                 |
| `src/stylesheets/global/` | Truly global styles: CSS reset, typography, Bootstrap variable overrides, build-time injected components (link cards, button groups, footer) | `base.css`, `theme.css`, `fonts.css`                    |

#### B. CSS Ownership Comments in `base.css`

When a global CSS selector belongs to a known (planned or existing) Vue
component, annotate with a `TODO:` comment:

```css
/* TODO: §4.8 → ThemeAwareImg.vue */
.img-fit { ... }

/* TODO: §4.9 → AppNavbar.vue */
.nav-link { ... }

/* TODO: §4.5 → v-b-tooltip (may stay global) */
.tooltip { ... }
```

When a selector is explicitly NOT owned by any Vue component (build-time
injected, shared utility), document the reason:

```css
/* ========================================================================
   Button Groups
   (Build-time injected link button groups — not owned by any Vue component.)
   ======================================================================== */
```

#### C. Legacy Bridge Pattern (`window.__xxx`)

When a Vue component replaces a legacy TS module that still has consumers
outside the Vue tree (e.g. `page-transition.ts`, `lang-switcher.ts`,
`main-lightweight.ts`), use a **bridge module**:

```
┌──────────────────────┐     window.__xxx     ┌───────────────────┐
│  legacy-consumer.ts  │ ─────────────────→  │  bridge-module.ts │
│  (page-transition,   │                      │  (thin wrapper)   │
│   lang-switcher)     │                      └────────┬──────────┘
└──────────────────────┘                               │ delegate
                                                       ▼
┌──────────────────────┐     defineExpose      ┌──────────────────┐
│  App.vue             │ ←──────────────────  │  Component.vue   │
│  (sets window.__xxx) │    template ref       │  (owns logic +   │
└──────────────────────┘                       │   CSS)           │
                                               └──────────────────┘
```

Components following this pattern:

| Bridge variable       | Vue component          | Legacy consumers                                               |
| --------------------- | ---------------------- | -------------------------------------------------------------- |
| `window.__loadingBar` | `LoadingBar.vue`       | `page-transition.ts`, `lang-switcher.ts`                       |
| `window.__scrollHint` | `ScrollHint.vue`       | `page-content-initializer.ts`                                  |
| `window.__noCopy`     | `CopyProtectedImg.vue` | `main-lightweight.ts` (hybrid: Vue delegate + direct fallback) |

Bridge module template:

```typescript
/** Bridge — delegates to the Vue component via window.__xxx. */

function get(): NonNullable<Window["__xxx"]> | null {
  return window.__xxx ?? null;
}

export function publicAPI(): void {
  get()?.method();
}
```

When a legacy consumer runs **without** Vue (e.g. 404 lightweight page),
the bridge module MUST include a direct-implementation fallback or the
consumer must be audited for compatibility.

#### D. Static HTML Coexistence

Some Vue components control static HTML elements that are injected at
build time (`build/page-components/`, `build/builders/`). These components:

- Do NOT render visible template content (use `<div />` placeholder)
- Use `onMounted` to locate the static element via `document.getElementById`
- Own the CSS via non-scoped `<style>` blocks
- Expose imperative methods via `defineExpose`

Components following this pattern:

- `LoadingScreen.vue` — controls `#loading-screen` (injected in each `.html` page)
- `LoadingBar.vue` — controls `#page-transition-progress` (injected via `header.html`)

### 6.2 Files to Update

- [ ] Create `.github/instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md`
  - CSS style block taxonomy (§A)
  - CSS ownership comments (§B)
  - Legacy bridge pattern (§C)
  - Static HTML coexistence (§D)
- [ ] Update `.github/instructions/1-tech-stack/1-base.instructions.md`
  - Add Vue 3 + `bootstrap-vue-next` to tech stack
- [ ] Update `.github/instructions/2-general-naming-conventions/3-typescript.instructions.md`
  - Add `.vue` file naming convention (PascalCase)
  - Add `composables/` naming convention (`useXxx.ts`)
- [ ] Update `.github/instructions/3-project-structural-constraints/1-folder-overview.instructions.md`
  - Add `src/components/` (layout, ui, modals)
  - Add `src/composables/`
  - Add `src/plugins/`
- [ ] `pnpm typecheck` (docs only — no code changes expected)

---

## Phase 7 - Legacy Bridge Elimination (Future)

> **Goal:** Eliminate all `window.__xxx` bridge calls by Vue-ifying build-time
> injected components (link cards, button groups) and their downstream consumers.
> **Status:** Deferred — depends on build-time injection system redesign.

### 7.1 Residual Bridge Modules (after Phase 5)

These modules survive Phase 5 cleanup because they serve consumers that are
not yet Vue components:

| Module           | Bridge variable              | Blocked by                                                          |
| ---------------- | ---------------------------- | ------------------------------------------------------------------- |
| `loading-bar.ts` | `window.__loadingBar`        | `page-transition.ts`, `lang-switcher.ts`                            |
| `scroll-hint.ts` | `window.__scrollHint`        | `page-content-initializer.ts`                                       |
| `no-copy.ts`     | `window.__noCopy`            | _(none — generic fallback only)_                                    |
| `tooltips.ts`    | _(none — generic lifecycle)_ | Build-time `data-bs-toggle="tooltip"` on link cards / button groups |
| `toast.ts`       | _(none — legacy export)_     | SPA re-init after page transitions                                  |

### 7.2 Elimination Strategy

- [ ] Vue-ify link card rendering (build-time HAST → Vue component or hybrid)
  - Removes need for `initAllTooltips()` on `data-bs-toggle="tooltip"`
  - Enables `v-b-tooltip` directive on all tooltip elements
- [ ] Vue-ify link button group rendering
  - Same as above for button group tooltips
- [ ] Migrate `page-transition.ts` to Vue `<Transition>` or Vue Router
  - Eliminates `window.__loadingBar` consumer
- [ ] Migrate `lang-switcher.ts` to Vue composable
  - Eliminates `window.__loadingBar` consumer
- [ ] Migrate `page-content-initializer.ts` to per-page `onMounted`
  - Eliminates `window.__scrollHint` consumer
- [ ] Migrate `main-lightweight.ts` (404 page) — already demoted to `public/404.html` static page (§4.4a)
- [ ] Delete all residual bridge modules from `src/ui/`
- [ ] `pnpm typecheck`

---

## Phase 8 - SPA Migration (Future)

> **Goal:** Replace MPA with Vue Router for SPA-style navigation.
> **Status:** Deferred — evaluate after Phase 7 is complete.

- [ ] Evaluate trade-offs (SEO impact, build-time injection compatibility, bundle size)
- [ ] If proceeding:
  - [ ] Install `vue-router`
  - [ ] Create `src/pages/` with one `.vue` per route
  - [ ] Configure router in `main.ts`
  - [ ] Consolidate `rollupOptions.input` in `vite.config.ts` to single `index.html`
  - [ ] Remove `features/page-transition.ts`
  - [ ] Remove individual `.html` files (consolidate into `index.html`)

---

## Target `src/` Structure (Post-Phases 1–5)

```
src/
├── types/                              # Shared types (unchanged)
│   ├── app.ts                          #   Lang, ThemeChoice, StorageKey, AppEvent
│   ├── css.d.ts                        #   CSS module declarations
│   ├── globals.d.ts                    #   window.* type extensions
│   ├── hast.ts                         #   HAST node types
│   └── vue-shims.d.ts                  #   .vue module declaration
│
├── utils/                              # Pure functions (extracted from core/)
│   ├── path.ts                         #   normalizeInternalPath, extractPageName, isInternalPage
│   └── dom.ts                          #   setElementAttributes, extractPlainText
│
├── composables/                        # Reactive state + side-effects
│   ├── useLocalStorage.ts              #   ref ↔ localStorage bidirectional binding
│   ├── useTheme.ts                     #   theme preference + effective theme + transition overlay
│   ├── useI18n.ts                      #   locale + messages + t()
│   ├── useQRCode.ts                    #   QR code canvas generation
│   └── useExternalLink.ts             #   external link confirmation logic (used by modal)
│
├── plugins/                            # Vue plugins (global provide / inject)
│   └── i18n.ts                         #   app.provide locale + messages; register $t()
│
├── components/                         # Vue SFCs - PascalCase filenames
│   ├── layout/
│   │   └── AppNavbar.vue               #   nav links, dropdown menus, mobile brand scroll
│   ├── ui/
│   │   ├── LoadingScreen.vue           #   spinner overlay with fade-out
│   │   ├── LoadingBar.vue              #   top-edge progress bar
│   │   ├── ToastStack.vue              #   reactive toast notifications (BToast)
│   │   ├── ScrollHint.vue              #   scroll-down indicator
│   │   ├── ThemeAwareImg.vue           #   src swap on theme change + loading opacity
│   │   ├── InlineSvg.vue               #   fetch SVG → inject inline
│   │   └── CopyProtectedImg.vue        #   no-right-click overlay
│   └── modals/
│       ├── SettingsModal.vue           #   theme, language, new-tab, animations toggles
│       ├── ExternalLinkConfirmModal.vue #  URL display, new-tab toggle, open/share/download
│       └── QRCodeModal.vue             #   QR code generation + icon overlay + PNG download
│
├── stylesheets/                        # Global CSS only (component styles in <style scoped>)
│   ├── base.css                        #   :root, body, typography, Bootstrap overrides
│   ├── theme.css                       #   --shlh-* custom properties, [data-bs-theme]
│   ├── fonts.css                       #   @font-face, font stacks (--shlh-font-*)
│   ├── accessibility.css               #   prefers-reduced-*, .user-input-keyboard, skip-to-content
│   └── transitions.css                 #   shared Vue <Transition> class names
│
├── App.vue                             # Root component: init orchestration + modal mounting
├── main.ts                             # Entry: CSS imports + globals + side-effects + createApp
├── main-lightweight.ts                 # 404 entry (no Vue - stays as vanilla TS)
│
├── ui/                                 # Residual legacy bridge modules (→ Phase 7 elimination)
│   ├── loading-bar.ts                  #   bridge → window.__loadingBar
│   ├── scroll-hint.ts                  #   bridge → window.__scrollHint
│   ├── no-copy.ts                      #   hybrid bridge → window.__noCopy + lightweight fallback
│   ├── tooltips.ts                     #   generic tooltip lifecycle (build-time elements)
│   └── toast.ts                        #   legacy SPA re-init consumers
│
├── index.html                          # MPA pages - <div id="app"> + <script type="module">
├── about.html
├── artworks-and-videos.html
├── blogs-and-sponsor.html
├── chatting.html
├── softwares.html
└── 404.html                            # Lightweight page (no Vue)
```

---

## Files to Remove (by end of Phase 5)

| File                                         | Replaced by                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `src/core/utils.ts`                          | `src/utils/path.ts` + `src/utils/dom.ts`                                 |
| `src/core/i18n.ts`                           | `src/plugins/i18n.ts` + `src/composables/useI18n.ts`                     |
| `src/ui/theme.ts`                            | `src/composables/useTheme.ts`                                            |
| `src/ui/settings.ts`                         | `src/components/modals/SettingsModal.vue`                                |
| `src/ui/navbar.ts`                           | `src/components/layout/AppNavbar.vue`                                    |
| `src/ui/tooltips.ts`                         | `v-b-tooltip` directive from `bootstrap-vue-next`                        |
| `src/ui/modal.ts`                            | `<BModal>` built-in focus management                                     |
| `src/ui/toast.ts`                            | `src/components/ui/ToastStack.vue` + `<BToast>`                          |
| `src/ui/loading-screen.ts`                   | `src/components/ui/LoadingScreen.vue`                                    |
| `src/ui/loading-bar.ts`                      | `src/components/ui/LoadingBar.vue`                                       |
| `src/ui/scroll-hint.ts`                      | `src/components/ui/ScrollHint.vue`                                       |
| `src/ui/img-utils.ts`                        | `src/components/ui/ThemeAwareImg.vue`                                    |
| `src/ui/no-copy.ts`                          | `src/components/ui/CopyProtectedImg.vue`                                 |
| `src/ui/svg-utils.ts`                        | `src/components/ui/InlineSvg.vue`                                        |
| `src/features/page-transition.ts`            | Vue `<Transition>` (MPA) or Vue Router (SPA)                             |
| `src/features/external-link-confirmation.ts` | `src/components/modals/ExternalLinkConfirmModal.vue`                     |
| `src/features/qr-code.ts`                    | `src/components/modals/QRCodeModal.vue` + `src/composables/useQRCode.ts` |
| `src/features/lang-switcher.ts`              | `src/plugins/i18n.ts` + `src/composables/useI18n.ts`                     |
| `src/features/page-content-initializer.ts`   | Per-page `onMounted` in route components                                 |
| `src/stylesheets/components/*.css`           | `<style scoped>` in respective `.vue` components                         |
