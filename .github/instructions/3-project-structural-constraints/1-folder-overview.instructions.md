---
description: >
  Project folder structure: src/ layered architecture (types -> core -> ui -> features),
  build/ for build-time scripts, public/ for static assets, file placement rules per layer.
  Use when: creating new files, organizing modules, or determining where to place new code.
applyTo: >
  src/**/*.ts;
  src/stylesheets/**;
  build/**/*.ts
---

### 3.1 Folder Overview

| Folder                    | Purpose                                                                                                                               | Where to Add New Code                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `.github/`                | GitHub-specific configurations (Copilot instructions, CI)                                                                             | —                                                     |
| `build/`                  | **Build-time scripts** — Vite plugins, page meta, shared utilities. Flat structure (no sub-directories).                              | New Vite plugin or build utility                      |
| `public/`                 | **Static assets** served as-is by Vite, no processing                                                                                 | See sub-folders below                                 |
| `public/configs/i18n/`    | Translation JSON files, one per language                                                                                              | New translation file for each added language          |
| `public/images/`          | Image assets organized by format (avif, png, svg, webp)                                                                               | New images in the appropriate sub-folder              |
| `public/legacy/`          | Broad-compatibility assets (IE11 compatible)                                                                                          | New legacy compatibility asset                        |
| `src/`                    | **Vite source** — all TS, Vue SFCs, CSS, HTML entry points                                                                            | See sub-folders below                                 |
| `src/*.html`              | MPA entry points (index, about, artworks-and-videos, blogs-and-sponsor, chatting, softwares). Static `<noscript>` + `<div id="app">`. | —                                                     |
| `src/types/`              | Shared type definitions, enums, module declarations                                                                                   | New shared type or enum                               |
| `src/core/`               | **Pure logic** — no DOM, no events. `i18n.ts`, `utils.ts`.                                                                            | New pure utility or state module                      |
| `src/composables/`        | **Vue composables** — reactive state + side-effects. `useI18n.ts`, `useTheme.ts`, `useLocalStorage.ts`, etc.                          | New composable when extracting reactive logic         |
| `src/plugins/`            | **Vue plugins** — global provide/inject. `i18n.ts`.                                                                                   | New plugin when adding app-level injection            |
| `src/components/`         | **Vue SFCs** — `layout/` (navbar, footer), `ui/` (indicators), `modals/` (settings, confirmations), `cards/`, `buttons/`.             | New `.vue` component in the appropriate sub-directory |
| `src/pages/`              | **Page components** — one `.vue` per route. `IndexPage.vue`, `AboutPage.vue`, etc.                                                    | New page component when adding a route                |
| `src/ui/`                 | **Legacy DOM modules** — imperative DOM ops and Bootstrap wrappers. `accessibility.ts`, `theme.ts`, etc. (diminishing).               | Only when Vue migration is blocked                    |
| `src/stylesheets/global/` | **Global CSS** — reset, theme variables, fonts, accessibility. No component-specific styles.                                          | New global style or add to existing file              |
| `src/configs/`            | **Runtime JSON configs** — `link-cards/`, `link-button-groups/`, `language-list.json`.                                                | New config file for runtime data                      |
| `tools/`                  | Build-time helper scripts (local only)                                                                                                | New helper script                                     |

**Layered architecture (`src/`):**

```
types/       -> shared type definitions and enums (app.ts, hast.ts, globals.d.ts, css.d.ts,
  ￪            vue-shims.d.ts, vue-augment.d.ts, bootstrap.d.ts)
  |
core/        -> pure logic & global state — no DOM, no events (i18n.ts, utils.ts)
  ￪
composables/ -> Vue reactive state + side-effects (useI18n.ts, useTheme.ts, useLocalStorage.ts, etc.)
  ￪
ui/          -> legacy imperative DOM & Bootstrap wrappers (accessibility.ts, theme.ts, etc.)
  ￪            Diminishing — new code should use Vue composables / components instead.
  |
components/  -> Vue SFCs (layout/, ui/, modals/, cards/, buttons/)
  ￪ pages/       PascalCase filenames, <script setup> + <style scoped>.
  |
plugins/     -> Vue plugins — global provide/inject (i18n.ts)
  ￪
main.ts      -> Entry point: CSS imports + globals + createApp + mount
router.ts    -> Vue Router config (routes, scrollBehavior, error recovery)
App.vue      -> Root shell (nav, router-view, modals, initialization)
```

| Layer          | Semantics                                                                   | May import from                                      | Must NOT import from                              |
| -------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `types/`       | Shared type definitions                                                     | npm, browser APIs                                    | `core/*`, `ui/*`, `composables/*`, `components/*` |
| `core/`        | Pure functions, data transforms, global state. **No DOM, no events.**       | `types/*`                                            | `ui/*`, `composables/*`, `components/*`           |
| `composables/` | Vue reactive state + side-effects. May call `inject()`.                     | `types/*`, `core/*`, `ui/*` (limited)                | `components/*`                                    |
| `ui/`          | Legacy DOM manipulation, event listeners, Bootstrap wrappers.               | `types/*`, `core/*`                                  | `composables/*`, `components/*`                   |
| `components/`  | Vue SFCs. Own template + styles. May use composables, core utils, ui.       | `types/*`, `core/*`, `composables/*`, `ui/*`         | —                                                 |
| `pages/`       | Page-level components. One per route. Renders cards, buttons, hero content. | `types/*`, `core/*`, `composables/*`, `components/*` | `ui/*` (use composables instead)                  |
| `plugins/`     | Vue plugins — global provide/inject registrations.                          | `types/*`, `core/*`                                  | `ui/*`, `composables/*`, `components/*`           |

**Decoupling patterns (when a direct import would violate the hierarchy):**

- **Composable extraction**: When multiple components share state or side-effects, extract to `composables/`. Example: `useTheme.ts` provides theme preference to both `AppNavbar.vue` and `SettingsModal.vue`.
- **provide/inject**: When a sibling component needs access to a service (e.g. ToastStack), use Vue's provide/inject. Example: `SHOW_TOAST_KEY` — App.vue provides, `useToast()` injects in any descendant.
- **Vue Router guards**: Use `router.beforeEach` / `router.afterEach` for cross-cutting navigation concerns (LoadingBar, ?lang= preservation, external-link indicators) instead of imperative DOM listeners.

**File placement rules**:

- Put TS modules in `src/{core,composables,ui}/` according to their **semantic role**:
  - Pure logic, data transforms, global state (no DOM, no events) → `core/`.
  - Vue reactive state + side-effects → `composables/`.
  - Legacy imperative DOM / Bootstrap wrappers → `ui/` (diminishing — prefer Vue components).
- Put shared TS types/enums in `src/types/`:
  - `app.ts` — `Lang`, `ThemeChoice`, enums (`StorageKey`, `AppEvent`).
  - `hast.ts` — HAST node types (`HastNode`, `HastProperties`).
  - `globals.d.ts` — Window interface extensions (`window.bootstrap`, `window.toHtml`).
  - `bootstrap.d.ts` — Bootstrap JS types (`Tooltip`, `Offcanvas`).
  - `css.d.ts` — Module declaration for `*.css` imports.
  - `vue-shims.d.ts` / `vue-augment.d.ts` — Vue SFC and `$t()` type augmentation.
- Put Vue SFCs in `src/components/` by function: `layout/`, `ui/`, `modals/`, `cards/`, `buttons/`.
- Put page-level components in `src/pages/` — one per route.
- Put global CSS in `src/stylesheets/global/` — reset, theme, fonts, accessibility.
- Put runtime JSON configs in `src/configs/` — link-cards, link-button-groups, language-list.
- Put translation JSON in `public/configs/i18n/` — one file per language.
- Put broad-compatibility assets in `public/legacy/`.
