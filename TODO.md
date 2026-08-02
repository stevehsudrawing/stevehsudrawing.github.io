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

## Phase 0 — Vue 3 Shell ✅

> **Goal:** Introduce Vue 3 runtime + `bootstrap-vue-next` without breaking existing functionality.

- [x] Install `vue` + `bootstrap-vue-next` (dependencies)
- [x] Install `@vitejs/plugin-vue` + `unplugin-vue-components` (devDependencies)
- [x] Create `src/types/vue-shims.d.ts` — `.vue` module type declaration
- [x] Update `vite.config.ts`
  - [x] Add `vue()` plugin
  - [x] Add `Components({ resolvers: [BootstrapVueNextResolver()], dts: true, directives: true })`
- [x] Update `tsconfig.json` — add `src/**/*.vue` and `components.d.ts` to `include`
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
- [ ] **Verify in browser:** open `http://localhost:5173/` and spot-check all pages

---

## Phase 1 — Stylesheets Reorganization

> **Goal:** Separate global CSS from component-scoped CSS. Component CSS will eventually
> migrate into `<style scoped>` blocks inside `.vue` files; global CSS stays in `stylesheets/`.

### 1.1 Create folder structure

```
src/stylesheets/
├── global/                          # Never migrating — always global
│   ├── base.css                     #   :root, body, Bootstrap overrides
│   ├── theme.css                    #   --shlh-* variables, [data-bs-theme]
│   ├── fonts.css                    #   @font-face, font stacks
│   └── accessibility.css            #   prefers-reduced-*, .user-input-keyboard, .skip-to-content
│
└── components/                      # Temporary — will migrate to Vue <style scoped>
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

- [ ] Create `src/stylesheets/global/` directory
- [ ] Create `src/stylesheets/components/` directory
- [ ] Move `base.css` → `stylesheets/global/base.css`
- [ ] Move `theme.css` → `stylesheets/global/theme.css`
- [ ] Move `fonts.css` → `stylesheets/global/fonts.css`
- [ ] Move `accessibility.css` → `stylesheets/global/accessibility.css`
- [ ] Move remaining 10 CSS files → `stylesheets/components/`
- [ ] Update import paths in `src/main.ts` (14 lines)
- [ ] Update import paths in `src/main-lightweight.ts`
- [ ] `pnpm typecheck`
- [ ] `pnpm dev` — verify visual appearance unchanged

---

## Phase 2 — Composables Layer

> **Goal:** Extract reactive state from `core/` and `ui/` modules into Vue composables.
> Existing imperative modules keep working; composables sit alongside them until consumers are migrated.

### 2.1 Prerequisite composable

- [ ] Create `src/composables/useLocalStorage.ts`
  - Reactive `ref<T>` that auto-syncs with `localStorage`
  - Will replace scattered `localStorage.getItem` / `setItem` across theme, i18n, settings, external-link

### 2.2 Theme composable

- [ ] Create `src/composables/useTheme.ts`
  - `preference` ref (auto / light / dark, synced to `StorageKey.Theme`)
  - `effectiveTheme` computed (resolves "auto" → system preference)
  - `isTransitioning` ref (overlay cross-fade state)
  - `switchWithTransition(choice)` async function
  - System theme listener via `matchMedia("(prefers-color-scheme: dark)")`
  - `updateThemeToggleText`, `setActiveThemeItem` as computed-driven helpers
- [ ] Wire `useTheme` into `App.vue` (replace direct `import { ... } from "./ui/theme.js"`)
- [ ] Keep `ui/theme.ts` in place for `main-lightweight.ts` consumers until that page is migrated
- [ ] `pnpm typecheck`

### 2.3 I18n composable + plugin

- [ ] Create `src/plugins/i18n.ts` — Vue plugin
  - Provide `locale` ref + `messages` ref via `app.provide`
  - Register `$t(key, fallback?)` global method
- [ ] Create `src/composables/useI18n.ts`
  - `t(key, fallback?)` function (reads from provided `messages`)
  - `setLocale(rawLang)` async function (fetch JSON → update `messages`)
  - Will replace: `currentLang`, `langData`, `normalizeLang`, `translate`, `applyLangData`
- [ ] Wire `i18n` plugin into `main.ts` (`app.use(i18n)`)
- [ ] Wire `useI18n` into `App.vue`
- [ ] Keep `core/i18n.ts` in place for `main-lightweight.ts` consumers
- [ ] `pnpm typecheck`

---

## Phase 3 — Modal Components

> **Goal:** Replace 3 manually-managed Bootstrap modals with `<BModal>` + `v-model`.
> This eliminates `ui/settings.ts`, `features/external-link-confirmation.ts`, and `features/qr-code.ts`.

### 3.1 Settings Modal

- [ ] Create `src/components/modals/SettingsModal.vue`
  - `<BModal v-model="visible">` — replaces `new bootstrap.Modal(...)`
  - Theme selector: `<BDropdown>` — replaces `.theme-item` event delegation
  - Language selector: `<select v-model="locale">` — replaces `#language-select` event delegation
  - New-tab toggle: `<BFormCheckbox v-model="openInNewTab" switch>` — replaces `#external-links-new-tab-toggle`
  - Animations toggle: `<BFormCheckbox v-model="enableAnimations" switch :disabled="reducedMotion">`
  - Reset button — replaces `#confirm-reset-btn` event delegation
  - Expose `show()` / `hide()` via `defineExpose`
- [ ] Wire `SettingsModal` into `App.vue`
- [ ] Remove `initSettingEventListeners()`, `initSettingsModal()`, `updateAnimationToggleState()` calls from `App.vue`
- [ ] Remove `ui/settings.ts`
- [ ] `pnpm typecheck`

### 3.2 External Link Confirmation Modal

- [ ] Create `src/components/modals/ExternalLinkConfirmModal.vue`
  - `props: { url: string, imgProperties?: object, hideQRButton?: boolean }`
  - `<BModal>` with "Open Link" / "Share" / "Download QR" / "Close" footer buttons
  - Sync new-tab toggle with `useLocalStorage("openExternalLinksInNewTab")`
  - Emit `open`, `share`, `download-qr` events
- [ ] Wire into `App.vue` — replace `initExternalLinkConfirmation()` + delegated click handler
- [ ] Remove `features/external-link-confirmation.ts`
- [ ] `pnpm typecheck`

### 3.3 QR Code Modal

- [ ] Create `src/components/modals/QRCodeModal.vue`
  - `props: { url: string, imgProperties?: object, hideOpenLink?: boolean }`
  - QR code canvas generation via `qrcode` library
  - Center overlay icon rendering
  - Download-as-PNG via `html-to-image` (with `html2canvas` fallback)
  - Share via Web Share API
- [ ] Wire into `App.vue`
- [ ] Remove `features/qr-code.ts`
- [ ] `pnpm typecheck`

---

## Phase 4 — UI Components

> **Goal:** Componentize remaining `ui/*.ts` modules and migrate corresponding CSS
> from `stylesheets/components/` into `<style scoped>` blocks.

### 4.1 Navbar

- [ ] Create `src/components/layout/AppNavbar.vue`
  - Active item highlighting → `:class="{ active: ... }"` computed
  - `<BDropdown>` for theme + language menus
  - Mobile brand scroll swap → `@scroll` + computed `transform`
  - Offcanvas toggle for mobile
  - Remove `ui/navbar.ts` + `stylesheets/components/navbar.css`
- [ ] `pnpm typecheck`

### 4.2 Loading Screen

- [ ] Create `src/components/ui/LoadingScreen.vue`
  - `v-if="!appReady"` with spinner + fade-out transition
  - Remove `ui/loading-screen.ts` + `stylesheets/components/loading-screen.css`
- [ ] `pnpm typecheck`

### 4.3 Loading Bar

- [ ] Create `src/components/ui/LoadingBar.vue`
  - Reactive progress bar (show / complete / hide)
  - Remove `ui/loading-bar.ts` + `stylesheets/components/loading-bar.css`
- [ ] `pnpm typecheck`

### 4.4 Toast Notifications

- [ ] Create `src/components/ui/ToastStack.vue`
  - `<BToast>` with reactive `toasts[]` array
  - `<TransitionGroup>` for enter/leave animations
  - Remove `ui/toast.ts`
- [ ] `pnpm typecheck`

### 4.5 Scroll Hint

- [ ] Create `src/components/ui/ScrollHint.vue`
  - Replaces manual create/remove lifecycle
  - Remove `ui/scroll-hint.ts` + `stylesheets/components/scroll-hint.css`
- [ ] `pnpm typecheck`

### 4.6 Theme-Aware Image

- [ ] Create `src/components/ui/ThemeAwareImg.vue`
  - `props: { lightSrc, darkSrc, feature?, ...attrs }`
  - Auto-swap `src` on theme change
  - Loading-opacity behavior
  - Remove `ui/img-utils.ts` + `stylesheets/components/img-utils.css`
- [ ] `pnpm typecheck`

### 4.7 Copy-Protected Image

- [ ] Create `src/components/ui/CopyProtectedImg.vue`
  - No-copy overlay + CSS protection
  - Remove `ui/no-copy.ts` + `stylesheets/components/no-copy.css`
- [ ] `pnpm typecheck`

### 4.8 Inline SVG

- [ ] Create `src/components/ui/InlineSvg.vue`
  - Fetches external SVG → injects inline
  - Dynamic `width` / `height` / `color-var` control
  - Remove `ui/svg-utils.ts`
- [ ] `pnpm typecheck`

### 4.9 Tooltips

- [ ] Replace all `createTooltip` / `disposeTooltip` calls with `v-b-tooltip` directive
- [ ] Remove `ui/tooltips.ts`
- [ ] `pnpm typecheck`

---

## Phase 5 — Cleanup

> **Goal:** Remove dead code after all consumers have been migrated.

- [ ] Delete `src/stylesheets/components/` folder (all CSS migrated to `<style scoped>`)
- [ ] Remove `window.bootstrap` global exposure in `main.ts` (no longer needed — `bootstrap-vue-next` handles all JS behavior)
- [ ] Remove `@types/bootstrap` from `devDependencies` (if bootstrap JS is no longer needed)
- [ ] Audit remaining `src/ui/*.ts` and `src/features/*.ts` files — delete any that have no remaining consumers
- [ ] Audit `build/page-components/modals.html` — may be removable if all modals are now Vue SFCs
- [ ] `pnpm typecheck` — ensure zero errors
- [ ] `pnpm build` — verify production build succeeds

---

## Phase 6 — SPA Migration (Future)

> **Goal:** Replace MPA with Vue Router for SPA-style navigation.
> **Status:** Deferred — evaluate after Phases 1–5 are complete.

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
├── components/                         # Vue SFCs — PascalCase filenames
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
├── main-lightweight.ts                 # 404 entry (no Vue — stays as vanilla TS)
│
├── index.html                          # MPA pages — <div id="app"> + <script type="module">
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
