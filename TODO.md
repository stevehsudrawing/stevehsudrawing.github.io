# Vue 3 Migration TODO

> Last updated: 2026-08-02
>
> **Conventions for this document:**
>
> - `[x]` = done, `[ ]` = not started, `[~]` = in progress
> - Each phase must pass `pnpm typecheck` before moving to the next.
> - **PascalCase** for `.vue` files; **dash-case** for `.ts` / `.css` files.
> - Multi-page app (MPA) stays for now; SPA deferred to Phase 8.

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

## Target File Tree (Post-Phase 8)

> See below for the expected final state after all legacy modules are eliminated
> (Phase 7) and MPA is replaced by Vue Router (Phase 8).

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
│   └── modals/
│       ├── ExternalLinkConfirmModal.vue
│       ├── QRCodeModal.vue
│       ├── ResetWarningModal.vue
│       └── SettingsModal.vue
│
├── pages/                              #   Phase 8: Vue Router routes
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
├── App.vue
├── main.ts
└── index.html                          #   Single entry (SPA)
```

### `build/`

```
build/
├── content-injection-plugin.ts         #   Simplified or removed
├── head-tags-plugin.ts
├── minify-plugin.ts
├── sitemap-plugin.ts
├── types.ts
├── utils.ts
├── configs/
│   ├── language-list.json
│   ├── page-meta.ts
│   ├── link-cards/               #   → Vue components (Phase 7)
│   └── link-button-groups/       #   → Vue components (Phase 7)
└── builders/
    ├── link-cards.ts             #   → removed (Phase 7)
    └── link-button-groups.ts     #   → removed (Phase 7)
```

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
`src/ui/theme.ts`, `src/*.html` (6 MPA pages), `window.bootstrap`,
`@types/bootstrap`, all `window.__xxx` bridge variables.

---

## Phase 7 - Legacy Bridge Elimination (Future)

> **Goal:** Eliminate all `window.__xxx` bridge calls by Vue-ifying build-time
> injected components (link cards, button groups) and their downstream consumers.
> **Status:** Deferred -- depends on build-time injection system redesign.

### 7.1 Residual Bridge Modules (after Phase 5)

These modules survive Phase 5 cleanup because they serve consumers that are
not yet Vue components:

| Module           | Bridge variable               | Blocked by                                                          |
| ---------------- | ----------------------------- | ------------------------------------------------------------------- |
| `loading-bar.ts` | `window.__loadingBar`         | `page-transition.ts`, `lang-switcher.ts`                            |
| `scroll-hint.ts` | `window.__scrollHint`         | `page-content-initializer.ts`                                       |
| `no-copy.ts`     | `window.__noCopy`             | _(none -- generic fallback only)_                                   |
| `tooltips.ts`    | _(none -- generic lifecycle)_ | Build-time `data-bs-toggle="tooltip"` on link cards / button groups |
| `toast.ts`       | _(none -- legacy export)_     | SPA re-init after page transitions                                  |

### 7.2 Elimination Strategy

- [ ] Vue-ify link card rendering (build-time HAST -> Vue component or hybrid)
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
- [ ] Migrate `main-lightweight.ts` (404 page) -- already demoted to `public/404.html` static page (§4.4a)
- [ ] Delete all residual bridge modules from `src/ui/`
- [ ] `pnpm typecheck`

---

## Phase 8 - SPA Migration (Future)

> **Goal:** Replace MPA with Vue Router for SPA-style navigation.
> **Status:** Deferred -- evaluate after Phase 7 is complete.

- [ ] Evaluate trade-offs (SEO impact, build-time injection compatibility, bundle size)
- [ ] If proceeding:
  - [ ] Install `vue-router`
  - [ ] Create `src/pages/` with one `.vue` per route
  - [ ] Configure router in `main.ts`
  - [ ] Consolidate `rollupOptions.input` in `vite.config.ts` to single `index.html`
  - [ ] Remove `features/page-transition.ts`
  - [ ] Remove individual `.html` files (consolidate into `index.html`)
