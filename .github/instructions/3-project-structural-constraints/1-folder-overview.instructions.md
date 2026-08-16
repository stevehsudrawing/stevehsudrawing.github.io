---
description: >
  Project folder structure: src/ layered architecture (types -> core -> ui ->
  features), build/ for build-time scripts, public/ for static assets, file
  placement rules per layer. Use when: creating new files, organizing modules,
  or determining where to place new code.
applyTo: >
  src/**/*.ts;
  src/stylesheets/**;
  build/**/*.ts
---

### 3.1 Folder Overview

| Folder             | Purpose                                                                                                                                                                                                                    | Where to Add New Code                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `.github/`         | GitHub-specific configurations (Copilot instructions, CI)                                                                                                                                                                  | —                                                     |
| `build/`           | **Build-time scripts** — Vite plugins, page meta, shared utilities. Flat structure (no sub-directories).                                                                                                                   | New Vite plugin or build utility                      |
| `public/`          | **Static assets** served as-is by Vite, no processing                                                                                                                                                                      | See sub-folders below                                 |
| `public/images/`   | Image assets organized by format (avif, png, svg, webp)                                                                                                                                                                    | New images in the appropriate sub-folder              |
| `public/legacy/`   | Broad-compatibility assets (IE11 compatible)                                                                                                                                                                               | New legacy compatibility asset                        |
| `src/`             | **Vite source** — all TS, Vue SFCs, CSS, HTML entry points                                                                                                                                                                 | See sub-folders below                                 |
| `src/*.html`       | MPA entry points (index, about, artworks-and-videos, blogs-and-sponsor, chatting, softwares). Static `<noscript>` + `<div id="app">`.                                                                                      | —                                                     |
| `src/types/`       | Shared type definitions, enums, module declarations                                                                                                                                                                        | New shared type or enum                               |
| `src/core/`        | **Pure logic** — no DOM, no events. `i18n.ts`, `utils.ts`.                                                                                                                                                                 | New pure utility or state module                      |
| `src/composables/` | **Vue composables** — reactive state + side-effects. `useI18n.ts`, `useTheme.ts`, `useStoredValue.ts`, etc.                                                                                                                | New composable when extracting reactive logic         |
| `src/plugins/`     | **Vue plugins** — global provide/inject. `i18n.ts`.                                                                                                                                                                        | New plugin when adding app-level injection            |
| `src/components/`  | **Vue SFCs** — organized by function: `nav/` (navigation bars, page chain), `ui/` (shared primitives), `modals/` (dialog overlays), `cards/` (content cards), `buttons/` (clickable elements), `links/` (link components). | New `.vue` component in the appropriate sub-directory |
| `src/pages/`       | **Page components** — one `.vue` per route. `IndexPage.vue`, `AboutPage.vue`, etc.                                                                                                                                         | New page component when adding a route                |
| `src/platform/`    | **Browser platform services** — imperative DOM APIs (document, window, navigator, localStorage) that Vue cannot own. `theme.ts`, `accessibility.ts`, `page-title.ts`, `bootstrap-css-detection.ts`, `storage.ts`.          | Only for browser APIs with no Vue equivalent          |
| `src/stylesheets/` | **Global CSS** — reset, theme variables, fonts, accessibility. No component-specific styles.                                                                                                                               | New global style or add to existing file              |
| `src/configs/`     | **Runtime configs** — TS constants (`site-meta.ts`, `language-list.ts`, `pages.ts`, `theme-options.ts`, `i18n/`) + JSON data (`link-cards/`, `link-button-groups/`).                                                       | New config file for runtime data                      |
| `tools/`           | Build-time helper scripts (local only)                                                                                                                                                                                     | New helper script                                     |

**Layered architecture (`src/`):**

```
types/       -> shared type definitions and enums
  ↑
configs/     -> pure runtime config data — no DOM, no events
  ↑
core/        -> pure logic & global state — no DOM, no events
  ↑
platform/    -> browser platform services — imperative DOM APIs that Vue cannot own
  ↑↓
composables/ -> Vue reactive state + side-effects
  ↑
components/  -> Vue SFCs
  ↑
pages/       -> PascalCase filenames, <script setup> + <style scoped>.
  ↑
plugins/     -> Vue plugins — global provide/inject
  ↑
main.ts      -> Entry point: CSS imports + globals + createApp + mount
router.ts    -> Vue Router config (routes, scrollBehavior, error recovery)
App.vue      -> Root shell (nav, router-view, modals, initialization)
```

| Layer          | May import from                                                   | Must NOT import from                                    |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `types/`       | npm, browser APIs                                                 | `core/*`, `platform/*`, `composables/*`, `components/*` |
| `configs/`     | npm (data-only libraries), `types/*`                              | `core/*`, `platform/*`, `composables/*`, `components/*` |
| `core/`        | `types/*`, `configs/*`                                            | `platform/*`, `composables/*`, `components/*`           |
| `platform/`    | `types/*`, `configs/*`, `core/*`, `composables/` (limited)        | `components/*`                                          |
| `composables/` | `types/*`, `configs/*`, `core/*`, `platform/*` (limited)          | `components/*`                                          |
| `components/`  | `types/*`, `configs/*`, `core/*`, `composables/*`, `platform/*`   | —                                                       |
| `pages/`       | `types/*`, `configs/*`, `core/*`, `composables/*`, `components/*` | `platform/*` (use composables instead)                  |
| `plugins/`     | `types/*`, `configs/*`, `core/*`                                  | `platform/*`, `composables/*`, `components/*`           |

**Decoupling patterns (when a direct import would violate the hierarchy):**

- **Composable extraction**: When multiple components share state or side-
  effects, extract to `composables/`. Example: `useTheme.ts` provides theme
  preference to both `AppNavbar.vue` and `SettingsModal.vue`.
- **provide/inject**: When a sibling component needs access to a service (e.g.
  ToastStack), use Vue's provide/inject. Example: `SHOW_TOAST_KEY` — App.vue
  provides, `useToast()` injects in any descendant.
- **Vue Router guards**: Use `router.beforeEach` / `router.afterEach` for cross-
  cutting navigation concerns (LoadingBar, ?lang= preservation, external-link
  indicators) instead of imperative DOM listeners.

**File placement rules**:

- **Principle of Semantic Priority**: New components should follow the rule of
  placing semantics in the corresponding folders.
- Put TS modules in `src/{core,composables,platform}/` according to their
  **semantic role**:
  - Pure logic, data transforms, global state (no DOM, no events) -> `core/`.
  - Vue reactive state + side-effects -> `composables/`.
  - Browser platform services (imperative DOM APIs) -> `platform/`.
- Put shared TS types/enums in `src/types/`:
  - `app.ts` — `Lang`, `ThemeChoice`, enums (`StorageKey`, `AppEvent`).
  - `hast.ts` — HAST node types (`HastNode`, `HastProperties`).
  - `globals.d.ts` — Window interface extensions (`window.bootstrap`,
    `window.toHtml`). **(Module — contains `import`.)**
  - `bootstrap.d.ts` — Bootstrap JS types (`Tooltip`, `Offcanvas`).
    **(Ambient script — no imports.)**
  - `css.d.ts` — Module declaration for `*.css` imports.
    **(Ambient script — no imports.)**
  - `vue-shims.d.ts` — Vue SFC module declaration (`*.vue`).
    **(Ambient script — no imports.)**
  - `vue-augment.d.ts` — Vue `$t()` type augmentation.
    **(Module — has `export {}`.)**
  - `raw-imports.d.ts` — Module declaration for Vite `?raw` imports.
    **(Ambient script — no imports; MUST NOT contain import/export.** See
    §2.3.1 for the ambient-vs-module distinction.)
- Put Vue SFCs in `src/components/` by function:
  - `nav/` — Navigation components
  - `ui/` — Shared UI primitives
  - `modals/` — Bootstrap modal dialogs
  - `cards/` — Content cards
  - `buttons/` — Clickable elements
  - `links/` — Link-handling components
- Put page-level components in `src/pages/` — one per route.
- Put global CSS in `src/stylesheets/` — reset, theme, fonts, accessibility.
- Put runtime configs in `src/configs/` — TS constants (`site-meta.ts`,
  `language-list.ts`) or JSON data (`link-cards/`, `link-button-groups/`).
- **build ↔ src import direction**: `build/*` may import from `src/*` (pure
  modules only — `types/`, `core/`, `configs/`); `src/*` must NEVER import from
  `build/*`. Mirrored declarations in `build/` should be replaced with imports
  of the `src` equivalents.
- **Storage access mandate**: all localStorage access MUST go through typed
  getter/setter accessors in `src/platform/storage.ts`; raw `localStorage`
  usage outside that module is forbidden.
- Put translation JSON in `src/configs/i18n/` — one file per language,
  statically imported by `translations.ts`.
- Put broad-compatibility assets in `public/legacy/`.
