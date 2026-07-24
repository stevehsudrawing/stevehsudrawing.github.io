# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

---

## 1. Tech Stack

### 1.1 Base

- **HTML** 5
- **CSS**
- **TypeScript**: Strict mode, compiled by Vite's esbuild (no separate tsc build step)
- **Build Tool**: [Vite 8](https://vite.dev/)
- **Package Manager**: [pnpm](https://pnpm.io/)

### 1.2 External Dependencies (npm, bundled by Vite)

All dependencies are installed via pnpm and imported in [`src/main.ts`](src/main.ts).
No CDN `<link>` or `<script>` tags are used.

| Resource                   | npm Package            | Role               | GitHub Repo                                                                         | Version |
|----------------------------|------------------------|--------------------|-------------------------------------------------------------------------------------|---------|
| Bootstrap                  | `bootstrap`            | Page Framework     | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)                               | 5.3.8   |
| Bootstrap Icons            | `bootstrap-icons`      | Icon Library       | [`twbs/icons`](https://github.com/twbs/icons)                                       | 1.11.3  |
| @popperjs/core             | `@popperjs/core`       | Positioning Engine | [`vusion/popper.js`](https://github.com/vusion/popper.js/)                          | 2.11.8  |
| Inter Font                 | `@fontsource/inter`    | Font Family        | [`rsms/inter`](https://github.com/rsms/inter)                                       | 5.3.0   |
| qrcode                     | `qrcode`               | QR Code Utility    | [`soldair/node-qrcode`](https://github.com/soldair/node-qrcode)                     | 1.5.4   |
| html-to-image              | `html-to-image`        | HTML -> Image      | [`bubkoo/html-to-image`](https://github.com/bubkoo/html-to-image)                   | 1.11.13 |
| html2canvas                | `html2canvas`          | HTML -> Canvas     | [`niklasvh/html2canvas`](https://github.com/niklasvh/html2canvas)                   | 1.4.1   |
| hast-util-to-html          | `hast-util-to-html`    | HAST -> HTML       | [`syntax-tree/hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html) | 9.0.5   |
| html-minifier-terser (dev) | `html-minifier-terser` | HTML Minifier      | [`terser/html-minifier-terser`](https://github.com/terser/html-minifier-terser)     | 7.2.0   |
| TypeScript (dev)           | `typescript`           | Type Checking      | [`microsoft/TypeScript`](https://github.com/microsoft/TypeScript)                   | 7.0.2   |
| Vite (dev only)            | `vite`                 | Build Tool         | [`vitejs/vite`](https://github.com/vitejs/vite)                                     | 8.1.5   |

### 1.3 Browser Baseline

The minimum browser versions are determined by both **npm dependencies** and **browser feature requirements**. Instead of UA-based version checks, the enforced baseline uses feature detection (`new Function('return 0?.x')`) in `public/legacy/env-detection.js` to verify that the JS engine supports optional chaining.

| Browser | Min Version | Release Date | Constrained By           |
|---------|-------------|--------------|--------------------------|
| Chrome  | ≥ 80        | 2020-02-04   | Optional chaining (`?.`) |
| Edge    | ≥ 80        | 2020-02-07   | Optional chaining (`?.`) |
| Firefox | ≥ 74        | 2020-03-10   | Optional chaining (`?.`) |
| Opera   | ≥ 67        | 2020-02-25   | Optional chaining (`?.`) |
| Safari  | ≥ 14        | 2020-09-16   | WebP                     |

#### 1.3.1 Per-Dependency Minimum Browser Versions

| Dependency              | Chrome | Edge   | Firefox | Opera  | Safari |
|-------------------------|--------|--------|---------|--------|--------|
| Bootstrap 5.3.8 CSS/JS  | **60** | **79** | **60**  | **47** | **12** |
| qrcode 1.5.4            | 1      | 12     | 1.5     | 9      | 2      |
| html-to-image 1.11.13   | 32     | 12     | 29      | 20     | 7.1    |
| html2canvas 1.4.1       | 1      | 12     | 3.5     | 12     | 6      |
| @popperjs/core 2.11.8   | **60** | **79** | **60**  | **47** | **12** |
| hast-util-to-html 9.0.5 | 61     | 16     | 60      | 48     | 11     |

> **Sources**:
> - Bootstrap 5.3.8: [Browsers and devices](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/) - `.browserslistrc` (`Chrome >= 60, Firefox >= 60, Safari >= 12`); IE11 and legacy EdgeHTML not supported
> - qrcode 1.5.4: [npm](https://www.npmjs.com/package/qrcode) - renders to `<canvas>`; requires [Canvas API](https://caniuse.com/canvas) support
> - html-to-image 1.11.13: [GitHub README](https://github.com/bubkoo/html-to-image) - requires `Promise` + SVG `<foreignObject>`
> - html2canvas 1.4.1: [Docs](https://html2canvas.hertzen.com/documentation) - "Chrome all, Firefox 3.5+, Safari 6+, Opera 12+"
> - @popperjs/core 2.11.8: [npm](https://www.npmjs.com/package/@popperjs/core/v/2.11.8) / [Floating UI docs](https://floating-ui.com/) - aligned with Bootstrap 5
> - hast-util-to-html 9.0.5: loaded via `<script type="module">`; requires [ES modules](https://caniuse.com/es6-module) support

#### 1.3.2 Browser Feature Requirements

The following browser features are required by this project. Their minimum browser versions are determined by [Can I Use](https://caniuse.com/) support tables (full support across all usage, not partial or behind a flag).

| Feature                                                                                    | Used By                          | Chrome | Edge   | Firefox | Opera  | Safari |
|--------------------------------------------------------------------------------------------|----------------------------------|--------|--------|---------|--------|--------|
| [Optional chaining (`?.`)](https://caniuse.com/mdn-javascript_operators_optional_chaining) | Any TS Scripts in `src/`         | **80** | **80** | **74**  | **67** | 13.1   |
| [WebP](https://caniuse.com/webp)                                                           | Image assets                     | 32     | 18     | 65      | 19     | **14** |
| [WOFF 2](https://caniuse.com/woff2)                                                        | Bootstrap Icons                  | 36     | 14     | 39      | 23     | 10     |
| [Variable fonts](https://caniuse.com/variable-fonts)                                       | Inter                            | 66     | 17     | 62      | 53     | 11     |
| [ES modules (`<script type="module">`)](https://caniuse.com/es6-module)                    | Vite entry point (`src/main.ts`) | 61     | 16     | 60      | 48     | 11     |

### 1.4 Deployment

- **Platform**: GitHub Pages
- **Build step**: `pnpm build` (Vite bundles to `dist/`), deployed via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
- **CI**: GitHub Actions — checks out → installs pnpm → builds → deploys to Pages

---

## 2. General Naming Conventions

### 2.1 HTML / CSS

| Category          | Convention / Constraint     | Examples                                                            |
|-------------------|-----------------------------|---------------------------------------------------------------------|
| Element IDs       | `dash-case`                 | `#page-content`, `#skip-button`, `#language-select`                 |
| CSS classes       | `dash-case`                 | `.loading-screen`, `.link-button-group`                             |
| Custom attributes | `data-*` with `dash-case`   | `data-bs-theme`, `data-i18n`, `data-i18n-html`, `data-i18n-tooltip` |
| Bootstrap classes | Use Bootstrap-native naming | `.btn-primary`, `.dropdown-menu`, etc.                              |

### 2.2 CSS Custom Properties

#### 2.2.1 Project-specific

Prefix `--shlh-*` (short for **S**teve **H**su's **L**ink-**H**ub). These variables cover two domains; their detailed naming conventions are documented in the relevant feature sections:

- **Color variables** - naming and brightness scale defined in [§4.4 Theme System](#44-theme-system).
- **Font variables** - naming, categories, priorities, and languages defined in [§4.11 Fonts & Typography](#411-fonts--typography).

#### 2.2.2 Bootstrap overrides

Prefix `--bs-*`. See [its documentation](https://getbootstrap.com/docs/5.3/customize/css-variables/) for more information. e.g. `--bs-border-radius`, `--bs-link-hover-color`

Although all `--bs-border-radius*` settings in `src/stylesheets/base.css` are 0px, it's still best to choose the border-radius size according to Bootstrap conventions.

### 2.3 TypeScript

| Category               | Convention             | Examples                                    |
|------------------------|------------------------|---------------------------------------------|
| Variables              | `camelCase`            | `currentLang`, `supportedLangs`, `langData` |
| Functions              | `camelCase`            | `loadAllComponents`, `updatePageText`       |
| Constants (top-level)  | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES`, `EXCLUDED_PAGES`          |
| Constants (`as const`) | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES = [...] as const`           |
| `const enum`           | `PascalCase`           | `StorageKey`, `AppEvent`                    |
| DOM element refs       | `camelCase`            | `htmlElement`, `prefersColorScheme`         |
| Interfaces             | `PascalCase`           | `HastProperties`, `LanguageItem`, `CardData`|
| Type aliases           | `PascalCase`           | `Lang`, `ThemeChoice` (string literals)     |

#### 2.3.1 Import Path Conventions

- All import paths must use **`.js` extensions** (not `.ts`), even when importing from TypeScript files. Vite's `moduleResolution: "bundler"` resolves `.js` → `.ts` automatically, but TypeScript 7 rejects `.ts` extensions unless `allowImportingTsExtensions` is enabled (which is not supported by Vite's esbuild).
- Import shared types from `../types/` using `import type` for type-only imports to ensure they are erased at build time.
    ```ts
    // Correct
    import type { Lang, ThemeChoice } from '../types/app.js';
    import { StorageKey, AppEvent } from '../types/app.js';

    // Wrong — .ts extension rejected by tsc
    import { StorageKey } from '../types/app.ts';
    ```

- **Direct Import Principle**: When using an export variable, function, or other object from a module as needed, import it **directly** from the source module, rather than passing it indirectly.

    - Correct:
    ```ts
    // In src/core/module.ts:
    export function doSomething(): void { /* ... */ }

    // In src/feature/module.ts:
    import { doSomething } from '../core/module.js';
    ```

    - Wrong:
    ```ts
    // In src/core/module.ts:
    export function doSomething(): void { /* ... */ }

    // In src/ui/module.ts:
    import { doSomething } from '../core/module.js';
    export { doSomething };

    // In src/feature/module.ts:
    import { doSomething } from '../ui/module.js';
    ```

#### 2.3.2 Function Naming by Category

| Prefix       | Purpose                            | Examples                                                                                            |
|--------------|------------------------------------|-----------------------------------------------------------------------------------------------------|
| `init*`      | Initialize / set up listeners      | `initThemePreference`, `initSkipButton`, `initAllTooltips`, `initAllScrollHints`, `initPageContent` |
| `dispose*`   | Tear down / remove listeners       | `disposeTooltip`, `disposeCopyLinkTooltip`, `disposeAllTooltips`                                    |
| `create*`    | Create and inject a DOM element    | `createTooltip`, `createScrollHint`                                                                 |
| `remove*`    | Remove a DOM element or attribute  | `removeScrollHint`, `removeExternalLinkIndicator`, `removeExternalLinkTargetBehavior`               |
| `add*`       | Add a DOM element or attribute     | `addExternalLinkIndicator`, `addExternalLinkTargetBehavior`                                         |
| `mark*`      | Set or clear a visual state marker | `markImageLoaded`, `markImageUnloaded`                                                              |
| `handle*`    | DOM event handler (named function) | `handleCopyLinkClick`, `handleTitleLinkAnchorClick`                                                 |
| `load*`      | Async data fetching                | `loadSupportedLangs`, `loadLang`, `loadAllComponents`, `loadHTML`                                   |
| `update*`    | Update existing DOM content        | `updatePageText`, `updatePageTitle`, `updateThemeToggleText`                                        |
| `apply*`     | Apply a setting / style change     | `applyThemePreference`, `applyAllThemeBasedImages`, `applyAllExternalLinkTargetBehavior`            |
| `get*`       | Retrieve / compute a value         | `getSystemTheme`                                                                                    |
| `set*`       | Set a state / attribute            | `setActiveNavItem`, `setActiveLangItem`, `setActiveThemeItem`                                       |
| `populate*`  | Fill UI lists / menus              | `populateLanguageMenus`                                                                             |
| `generate*`  | Create and inject DOM elements     | `generateLinkCards`                                                                                 |
| `hide*`      | Hide an element                    | `hideLoadingScreen`                                                                                 |
| `extract*`   | Parse / derive from input          | `extractPageName`                                                                                   |
| `normalize*` | Normalize / sanitize input         | `normalizeInternalPath`                                                                             |

> Prefer existing prefixes when adding new functions. If none fit, use a clear descriptive verb.

#### 2.3.3 Batch Functions Must Delegate to Single-Element Functions

A **batch function** is a function that queries multiple DOM elements and applies the same operation to each one. The per-element logic **must** be extracted into a reusable single-element function. The batch function then delegates to it.

- Batch function names **must** include `All` before the noun (e.g. `initAllTooltips()`, `applyAllThemeBasedImages()`).
- The corresponding single-element function describes the per-element action (e.g. `createTooltip(el)`, `applyThemeBasedImage(img)`).
- The single-element function should be **idempotent** (safe to call multiple times on the same element).
- Functions without a corresponding single-element function (pure event delegation, singleton initialization, etc.) do not need `All` in their name.

#### 2.3.4 Single-Element Functions Must Have Symmetric Counterparts

Every single-element function that **adds, creates, or initializes** something on a DOM element **must** have a corresponding single-element function that **removes, destroys, or cleans up** the same thing. This ensures that:

- Other modules can cleanly reverse an operation without inlining DOM manipulation logic.
- `removeEventListener` can precisely target the handler (requires a named `handle*` function, not an anonymous closure).
- The API surface is predictable: if there is an "on" path, there is an "off" path.

**Naming conventions for symmetric pairs:**

| Operation          | Add / Create / Init            | Remove / Destroy / Cleanup        |
|--------------------|--------------------------------|-----------------------------------|
| DOM element        | `create*` / `add*`             | `remove*`                         |
| Event listener     | `init*` (with named `handle*`) | `dispose*`                        |
| Visual state       | `mark*Loaded` / `mark*Active`  | `mark*Unloaded` / `mark*Inactive` |
| Bootstrap instance | `createTooltip`                | `disposeTooltip`                  |

**Existing symmetric single-element pairs:**

| Add / Create / Init                   | Remove / Destroy / Cleanup               | Module             |
|---------------------------------------|------------------------------------------|--------------------|
| `createTooltip(el)`                   | `disposeTooltip(el)`                     | `tooltips.ts`      |
| `initCopyLinkTooltip(link)`           | `disposeCopyLinkTooltip(link)`           | `tooltips.ts`      |
| `markImageLoaded(img)`                | `markImageUnloaded(img)`                 | `img-utils.ts`     |
| `addExternalLinkIndicator(link)`      | `removeExternalLinkIndicator(link)`      | `accessibility.ts` |
| `initTitleLinkAnchor(anchor)`         | `disposeTitleLinkAnchor(anchor)`         | `accessibility.ts` |
| `createScrollHint(group)`             | `removeScrollHint(group)`                | `scroll-hint.ts`   |
| `addExternalLinkTargetBehavior(link)` | `removeExternalLinkTargetBehavior(link)` | `settings.ts`      |

**Handler extraction rule:** If an `init*` function uses `addEventListener` with an anonymous function, the handler **must** be extracted as a named `handle*` function so the corresponding `dispose*` function can call `removeEventListener` with the same reference.

Existing batch / single-element pairs:

| Batch Function                         | Single-Element Function              | Module                |
|----------------------------------------|--------------------------------------|-----------------------|
| `initAllTooltips()`                    | `createTooltip(el)`                  | `tooltips.ts`         |
| `disposeAllTooltips()`                 | `disposeTooltip(el)`                 | `tooltips.ts`         |
| `initAllCopyLinkTooltips()`            | `initCopyLinkTooltip(link)`          | `tooltips.ts`         |
| `initAllColoredImages()`               | `applyColoredImage(img)`             | `img-utils.ts`        |
| `initAllImageLoadingOpacity()`         | `initImageLoadingOpacity(img)`       | `img-utils.ts`        |
| `applyAllThemeBasedImages()`           | `applyThemeBasedImage(img)`          | `theme.ts`            |
| `applyAllFaviconThemes()`              | `applyFaviconTheme(link)`            | `theme.ts`            |
| `addAllExternalLinkIndicators()`       | `addExternalLinkIndicator(link)`     | `accessibility.ts`    |
| `initAllTitleLinkAnchors()`            | `initTitleLinkAnchor(anchor)`        | `accessibility.ts`    |
| `initAllScrollHints()`                 | `createScrollHint(group)`            | `scroll-hint.ts`      |
| `applyAllExternalLinkTargetBehavior()` | `addExternalLinkTargetBehavior(link)`| `settings.ts`         |
| `loadAllComponents()`                  | `loadHTML(placeholder, name)`        | `component-loader.ts` |

---

## 3. Project Structural Constraints

### 3.1 Folder Overview

| Folder                              | Purpose                                                            | Where to Add New Code                                 | Local Only (Excluded from Remote Repo) |
|-------------------------------------|--------------------------------------------------------------------|-------------------------------------------------------|----------------------------------------|
| `.github/`                          | GitHub-specific configurations (Copilot instructions, CI)          | -                                                     |                                        |
| `src/`                              | **Vite source** - all TS modules, CSS, and the Vite entry point    | See sub-folders below                                 |                                        |
| `src/main.ts`                       | Vite entry point - full-feature pages (all except 404)             | -                                                     |                                        |
| `src/main-lightweight.ts`           | Vite entry point - lightweight pages (404) without Page Transition | -                                                     |                                        |
| `src/types/`                        | Shared TypeScript type definitions, enums, and module declarations | New shared type or enum                               |                                        |
| `src/configs/`                      | Page-level build-time configuration (head tags, metadata)          | New page entry in page-meta.js                        |                                        |
| `src/core/`                         | **Core modules** - zero project imports, only npm or browser APIs  | New core utility when it has no project dependencies  |                                        |
| `src/ui/`                           | **UI modules** - depend on `core/`, may depend on each other       | New UI module when it uses `core/` modules            |                                        |
| `src/features/`                     | **Feature modules** - depend on `core/` + `ui/`, orchestrate UI    | New feature module for cross-cutting functionality    |                                        |
| `src/stylesheets/`                  | CSS modules using modern CSS specifications - for all pages        | New CSS module, or add to an existing file            |                                        |
| `public/`                           | **Static assets** served as-is by Vite, no processing              | See sub-folders below                                 |                                        |
| `public/configs/`                   | JSON configuration data for i18n and link cards                    | New JSON config files as needed                       |                                        |
| `public/configs/i18n/`              | Translation JSON files, one per language                           | New translation file for each added language          |                                        |
| `public/configs/links/`             | Link-card data JSON files, one per page                            | New link-card JSON when adding a page with link cards |                                        |
| `public/images/png/splash/`         | Apple PWA splash screen images (generated by python script)        | -                                                     |                                        |
| `public/images/`                    | Image assets organized by format (png, webp, svg) then by purpose  | New images in the appropriate sub-folder              |                                        |
| `public/page-components/`           | HTML fragments loaded at runtime by the component loader           | New HTML fragment                                     |                                        |
| `public/legacy/`                    | Broad-compatibility assets (JS scripts/CSS, IE11 compatible)       | New legacy compatibility asset                        |                                        |
| `public/llms.txt`                   | Site overview for AI crawlers (`llmstxt.org` standard)             | -                                                     |                                        |
| `public/manifest.json`              | PWA manifest config                                                | -                                                     |                                        |
| `public/robots.txt`                 | Website `robots.txt`                                               | -                                                     |                                        |
| `public/sitemap.xml`                | Sitemap config                                                     | -                                                     |                                        |
| `tools/`                            | Build-time helper scripts                                          | -                                                     | ✓                                     |
| `test/`                             | Test pages for isolated feature validation                         | New test page                                         | ✓                                     |
| Root `*.html`                       | Page files (homepage, sub-pages, error pages)                      | New page file when adding a page                      |                                        |
| `vite.config.js`                    | Vite configuration - multi-page input, dev server, build options   | -                                                     |                                        |
| `package.json`                      | npm dependencies and scripts (`dev`, `build`, `preview`)           | -                                                     |                                        |

**Layered TS architecture (`src/`):**

```
types/    → shared across all layers (app.ts, hast.ts, globals.d.ts, css.d.ts)
  ↑
core/     → zero project imports (utils, i18n, img-utils, accessibility, etc.)
  ↑
ui/       → depends on core/ (theme, navbar, tooltips, settings, etc.)
  ↑
features/ → depends on core/ + ui/ (page-transition, link-cards, qr-code, etc.)
```

| Layer       | May import from                        | Must NOT import from         |
|-------------|----------------------------------------|------------------------------|
| `types/`    | npm packages, browser APIs             | `features/*` `ui/*` `core/*` |
| `core/`     | `types/*`                              | `features/*` `ui/*`          |
| `ui/`       | `types/*` `core/*`                     | `features/*`                 |
| `features/` | `types/*` `core/*` `ui/*` `features/*` | -                            |

**File placement rules**:

- Put TS modules in `src/{core,ui,features}/` according to their dependency level.
    - New modules with zero project imports → `core/`.
    - New modules depending only on `core/` → `ui/`.
    - New modules depending on `core/` + `ui/` (or orchestrating both) → `features/`.
- Put shared TS types/enums in `src/types/`. These are importable by all layers.
    - `app.ts` — Application-wide string literal types (`Lang`, `ThemeChoice`), enums (`StorageKey`, `AppEvent`).
    - `hast.ts` — HAST/node types used by link-cards and utils (`HastNode`, `HastProperties`, `CardData`, `GroupData`).
    - `globals.d.ts` — Window interface extensions (`window.bootstrap`, `window.toHtml`, etc.).
    - `css.d.ts` — Module declaration for `*.css` imports.
- Put CSS in `src/stylesheets/` — either in a relevant existing file or a new file.
    - If a feature needs both JS and CSS, create matching file names (e.g., `foo.ts` + `foo.css`).
- Put JSON configuration data in `public/configs/` under the appropriate sub-folder.
- Put reusable HTML fragments in `public/page-components/`.
- Put broad-compatibility assets (ES5, IE11) in `public/legacy/`.

### 3.2 General File Rules

#### 3.2.1 `src/`: Define Only, Never Execute

- Files in `src/` must **only define variables and functions**, using **TypeScript** syntax targeting ES2020. `var` should be avoided.
- Every exported variable and function **must have JSDoc** written for it.
- They must **NOT** contain top-level function calls or self-executing code.
- A function defined here should never call itself at the top level of the file.
- All execution / wiring happens in the `main.ts` or `main-lightweight.ts` entry points (see [§3.2.2](#322-srcmaints--srcmain-lightweightts-entry-points-wire-everything)).
- **Exception**: `public/legacy/env-detection.js` is a classic script (not a module) that runs before `<head>` to perform browser/crawler detection. It DOES execute at the top level, but must still use **ES5** syntax for broad compatibility.

```ts
// In src/core/example.ts:

// CORRECT:

/** @type {number} This is an exported constant. */
export const EXAMPLE_NUMBER = 1;

/**
 * This function will do something.
 * @returns {void}
 */
export function doSomething() { /* ... */ }

// WRONG:
doSomething();  // No top-level execution!
document.addEventListener('DOMContentLoaded', doSomething);  // No!
```

#### 3.2.2 `src/main.ts` & `src/main-lightweight.ts`: Entry Points, Wire Everything

- `main.ts`: Full-feature entry point. Imports all CSS, npm dependencies, and project modules. Performs early theme initialization (before first paint). Loads all components, i18n, settings, page transitions, QR code, link cards, etc. on `DOMContentLoaded`.
- `main-lightweight.ts`: Lightweight entry point for error pages (404). Same CSS and npm imports, but excludes Page Transition, QR code, link-cards generator, and external link confirmation. Loads a reduced set of modules on `DOMContentLoaded`.
- `public/legacy/env-detection.js`: Perform basic browser/environment detection before starting to load the page. Runs before `<head>`. (Kept as plain JS for ES5 compatibility.)

#### 3.2.3 `stylesheets/`: Two Sub-Folders, One Commenting Convention

- **`src/stylesheets/`** — CSS modules for all normal pages. Uses modern CSS specifications.
- **`public/legacy/`** — Broad compatibility CSS for error pages (`base.css`, supports IE 11).

Both sub-folders use the same CSS commenting format:

```css
/* ========================================================================
   Component Name - description
   ======================================================================== */

/* --- Child description --- */

.selector {
    /* ... */
}
```

#### 3.2.4 `*.html`: Page Tiers

- **Full Functionality Pages**: Reference `/src/main.ts`.
    - `index`
    - `about`
    - `artworks-and-videos`
    - `blogs-and-sponsor`
    - `chatting`
    - `softwares`
- **Error Pages (Lightweight)**: Reference `/src/main-lightweight.ts`.
    - `404`: The redirected page when an HTTP 404 occurs. Uses a cut-down entry point that excludes Page Transition, QR code, link-cards generator, and external-link confirmation to avoid layout conflicts when navigating back to full-feature pages.
- **Error Pages with Minimal External Reference (`error-*`)**: These pages don't rely on any external JS scripts, external CSS stylesheets (except `/public/legacy/base.css`) or external CDNs, which means that they don't use features such as i18n or the Page Transition System. The page layout should be as close to Bootstrap 5.3 as possible, but can be appropriately simplified.
    - `unsupported-browser`
    - `javascript-disabled`

#### 3.2.5 `*.md`: Document Writing Standards

- **Document Title**: Use a level-one heading (`#`) to indicate the document title.
- **Title Numbering Convention**: Starting from the secondary headings, add numbers before each level of heading to indicate position. Use dots to create a hierarchy for the headings. e.g.
    - `##`: `1.`
    - `###`: `1.2`
    - `####`: `1.2.3`
    - `#####`: `1.2.3.4`
    - `######`: `1.2.3.4.5`
- **In-document referencing**: Use the form `§` followed by a number to indicate locations within the document, and format it as a hyperlink for navigation. e.g. [§3.2.5](#325-md-document-writing-standards)
- The deepest level is a level 6 heading.

---

## 4. Feature Reference

> This part has been migrated to `.github/instructions/4-feature-references` and should be read as needed.

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
3. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `→`.
4. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
5. **Priority of norms/standards**: If there are more normative or standard practices, priority should be given to norms or standards, even if refactoring is required.
6. **Conventions of Commit Messages**:
    - Write in English (United States).
    - Use the simple present tense to describe changes. e.g. "Change" is **correct**; "Changed" is **wrong**.
    - The whole commit message should be as short as possible.
    - First provide a summary, then list the 1-4 main changes; minor changes can be ignored.
    - Basic example format:
    ```
    Summary
    - Major Change 1
    - Major Change 2
    - Major Change 3
    ```
