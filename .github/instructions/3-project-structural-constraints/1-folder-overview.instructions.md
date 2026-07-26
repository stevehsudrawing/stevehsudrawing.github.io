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

| Folder                              | Purpose                                                                                                                                                            | Where to Add New Code                                                | Local Only (Excluded from Remote Repo) |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | -------------------------------------- |
| `.github/`                          | GitHub-specific configurations (Copilot instructions, CI)                                                                                                          | -                                                                    |                                        |
| `build/`                            | **Build-time scripts** - Vite plugins, configs, builders                                                                                                           | See sub-folders below                                                |                                        |
| `build/builders/`                   | Build-time HTML generators (link-cards, link-button-groups)                                                                                                        | New builder when adding a new injection type                         |                                        |
| `build/configs/`                    | Build-time configuration data (page meta, link-card JSON)                                                                                                          | New page meta entry or link-card JSON                                |                                        |
| `build/configs/link-cards/`         | Link-card HAST JSON definitions, one per page                                                                                                                      | New link-card JSON when adding a page with link cards                |                                        |
| `build/configs/link-button-groups/` | Link-button-group JSON definitions, one per page                                                                                                                   | New button-group JSON when adding button groups                      |                                        |
| `build/page-components/`            | HTML fragments pre-rendered at build time into page templates                                                                                                      | New HTML fragment                                                    |                                        |
| `src/`                              | **Vite source** - all TS modules, CSS, and the Vite entry point                                                                                                    | See sub-folders below                                                |                                        |
| `src/main.ts`                       | Vite entry point - full-feature pages (all except 404)                                                                                                             | -                                                                    |                                        |
| `src/main-lightweight.ts`           | Vite entry point - lightweight pages (404) without Page Transition                                                                                                 | -                                                                    |                                        |
| `src/types/`                        | Shared TypeScript type definitions, enums, and module declarations                                                                                                 | New shared type or enum                                              |                                        |
| `src/core/`                         | **Foundation logic & global state** - pure functions, data transforms, global state. NO DOM manipulation, NO event listeners. (Currently: `i18n.ts`, `utils.ts`.)  | New pure utility or state module                                     |                                        |
| `src/ui/`                           | **Reusable UI components & behaviors** - DOM manipulation, event listeners, Bootstrap component wrappers. One concern per module. Depends on `core/` and `types/`. | New UI module when it manipulates DOM or wraps a Bootstrap component |                                        |
| `src/features/`                     | **Feature orchestration** - coordinates multiple `core/` + `ui/` modules into user-facing workflows. Depends on all lower layers.                                  | New feature when it orchestrates multiple modules                    |                                        |
| `src/stylesheets/`                  | CSS modules using modern CSS specifications - for all pages                                                                                                        | New CSS module, or add to an existing file                           |                                        |
| `public/`                           | **Static assets** served as-is by Vite, no processing                                                                                                              | See sub-folders below                                                |                                        |
| `public/configs/`                   | Runtime JSON configuration data for i18n                                                                                                                           | New JSON config files as needed                                      |                                        |
| `public/configs/i18n/`              | Translation JSON files, one per language                                                                                                                           | New translation file for each added language                         |                                        |
| `public/images/png/splash/`         | Apple PWA splash screen images (generated by python script)                                                                                                        | -                                                                    |                                        |
| `public/images/`                    | Image assets organized by format (png, webp, svg) then by purpose                                                                                                  | New images in the appropriate sub-folder                             |                                        |
| `public/legacy/`                    | Broad-compatibility assets (JS scripts/CSS, IE11 compatible)                                                                                                       | New legacy compatibility asset                                       |                                        |
| `public/llms.txt`                   | Site overview for AI crawlers (`llmstxt.org` standard)                                                                                                             | -                                                                    |                                        |
| `public/manifest.json`              | PWA manifest config                                                                                                                                                | -                                                                    |                                        |
| `public/robots.txt`                 | Website `robots.txt`                                                                                                                                               | -                                                                    |                                        |
| `public/sitemap.xml`                | Sitemap config                                                                                                                                                     | -                                                                    |                                        |
| `tools/`                            | Build-time helper scripts                                                                                                                                          | -                                                                    | ✓                                      |
| `test/`                             | Test pages for isolated feature validation                                                                                                                         | New test page                                                        | ✓                                      |
| `src/*.html`                        | Page files (homepage, sub-pages, error pages)                                                                                                                      | New page file when adding a page                                     |                                        |
| `vite.config.js`                    | Vite configuration - multi-page input, dev server, build options                                                                                                   | -                                                                    |                                        |
| `package.json`                      | npm dependencies and scripts (`dev`, `build`, `preview`)                                                                                                           | -                                                                    |                                        |

**Layered TS architecture (`src/`):**

```
types/    → shared type definitions and enums (app.ts, hast.ts, globals.d.ts, css.d.ts)
  ↑
core/     → foundation logic & global state - pure functions, no DOM (i18n.ts, utils.ts)
  ↑
ui/       → reusable UI components - DOM ops and event binding (theme, navbar, accessibility,
            loading-bar, toast, tooltips, img-utils, svg-utils, etc.)
  ↑
features/ → cross-cutting orchestration (page-transition, lang-switcher, qr-code,
            external-link-confirmation, page-content-initializer)
```

| Layer       | Semantics                                                                                               | May import from                        | Must NOT import from         |
| ----------- | ------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------- |
| `types/`    | Shared type definitions                                                                                 | npm packages, browser APIs             | `features/*` `ui/*` `core/*` |
| `core/`     | Foundation logic & state - pure functions, data transforms. **No DOM ops, no events.**                  | `types/*`                              | `features/*` `ui/*`          |
| `ui/`       | Reusable UI components - DOM manipulation, event listeners, Bootstrap wrappers. One concern per module. | `types/*` `core/*`                     | `features/*`                 |
| `features/` | Feature orchestration - coordinates core + ui into user-facing workflows.                               | `types/*` `core/*` `ui/*` `features/*` | -                            |

**Decoupling patterns (when a direct import would violate the hierarchy):**

- **Event-driven**: When `ui/` needs to trigger behavior in `features/` (which it cannot import), dispatch a `CustomEvent` via the `AppEvent` enum. The ui module dispatches; the feature module listens. Example: `LangSwitchRequested` - `settings.ts` (ui) dispatches, `lang-switcher.ts` (features) listens.
- **Extract shared module**: When multiple features need the same UI behavior, extract it to `ui/` so both can import it. Example: `loading-bar.ts` is used by both `page-transition.ts` and `lang-switcher.ts`.

**File placement rules**:

- Put TS modules in `src/{core,ui,features}/` according to their **semantic role**:
  - Pure logic, data transforms, global state (no UI-component-specific DOM ops, no events; infrastructure DOM is permitted) → `core/`.
  - DOM manipulation, event listeners, Bootstrap wrappers → `ui/`.
  - Cross-module orchestration (coordinates core + ui) → `features/`.
- Put shared TS types/enums in `src/types/`. These are importable by all layers.
  - `app.ts` - Application-wide string literal types (`Lang`, `ThemeChoice`), enums (`StorageKey`, `AppEvent`).
  - `hast.ts` - HAST/node types used by link-cards and utils (`HastNode`, `HastProperties`, `CardData`, `GroupData`).
  - `globals.d.ts` - Window interface extensions (`window.bootstrap`, `window.toHtml`, etc.).
  - `css.d.ts` - Module declaration for `*.css` imports.
- Put CSS in `src/stylesheets/` - either in a relevant existing file or a new file.
  - If a feature needs both JS and CSS, create matching file names (e.g., `foo.ts` + `foo.css`).
- Put JSON configuration data in `public/configs/` under the appropriate sub-folder.
- Put reusable HTML fragments in `build/page-components/` (injected at build time, not served to browser).
- Put broad-compatibility assets (ES5, IE11) in `public/legacy/`.
