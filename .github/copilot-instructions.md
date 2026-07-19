# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

---

## 1. Tech Stack

### 1.1 Base Language

- **HTML** 5
- **CSS**
- **JavaScript**: Vanilla JS

### 1.2 External Dependencies (CDN)

Loaded in `<head>` of each page:

| Resource          | Type | Role             | Homepage                                                                             | Introduction Page on `npmjs.com`                                   | GitHub Repo                                                       | URL                                                                                                                                                            | Version  |
|-------------------|------|------------------|--------------------------------------------------------------------------------------|--------------------------------------------------------------------|-------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| Bootstrap CSS     | CSS  | Page Framework   | [`https://getbootstrap.com/`](https://getbootstrap.com/)                             | [`bootstrap`](https://www.npmjs.com/package/bootstrap)             | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)             | [`https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css`](https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css)           | 5.3.8    |
| Bootstrap Icons   | CSS  | Icon Library     | [`https://icons.getbootstrap.com/`](https://icons.getbootstrap.com/)                 | [`bootstrap-icons`](https://www.npmjs.com/package/bootstrap-icons) | [`twbs/icons`](https://github.com/twbs/icons)                     | [`https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css`](https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css)               | (latest) |
| Inter Font Family | CSS  | Font Family      | [`https://rsms.me/inter/`](https://rsms.me/inter/)                                   | -                                                                  | [`rsms/inter`](https://github.com/rsms/inter)                     | [`https://rsms.me/inter/inter.css`](https://rsms.me/inter/inter.css)                                                                                           | (latest) |
| QRCode.js         | JS   | QR Code Utility  | [`https://davidshimjs.github.io/qrcodejs/`](https://davidshimjs.github.io/qrcodejs/) | [`qrcodejs`](https://www.npmjs.com/package/qrcodejs)               | [`davidshimjs/qrcodejs`](https://github.com/davidshimjs/qrcodejs) | [`https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`](https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js)                                       | 1.0.0    |
| html-to-image     | JS   | HTML -> Image    | -                                                                                    | [`html-to-image`](https://www.npmjs.com/package/html-to-image)     | [`bubkoo/html-to-image`](https://github.com/bubkoo/html-to-image) | [`https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js`](https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js) | 1.11.13  |
| html2canvas       | JS   | HTML -> Canvas   | [`https://html2canvas.hertzen.com/`](https://html2canvas.hertzen.com/)               | [`html2canvas`](https://www.npmjs.com/package/html2canvas)         | [`niklasvh/html2canvas`](https://github.com/niklasvh/html2canvas) | [`https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js`](https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js)             | 1.4.1    |

Loaded at the end of `<body>` of each page:

| Resource       | Type | Role               | Homepage                                                      | Introduction Page on `npmjs.com`                                 | GitHub Repo                                                | URL                                                                                                                                                            | Version |
|----------------|------|--------------------|---------------------------------------------------------------|------------------------------------------------------------------|------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|---------|
| @popperjs/core | JS   | Positioning Engine | [`https://popper.js.org/`](https://popper.js.org/) (Expired?) | [`@popperjs/core`](https://www.npmjs.com/package/@popperjs/core) | [`vusion/popper.js`](https://github.com/vusion/popper.js/) | [`https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js`](https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js)       | 2.11.8  |
| Bootstrap JS   | JS   | Page Framework     | [`https://getbootstrap.com/`](https://getbootstrap.com/)      | [`bootstrap`](https://www.npmjs.com/package/bootstrap)           | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)      | [`https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js`](https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js) | 5.3.8   |

### 1.3 Browser Baseline

The minimum browser versions are determined by both **our CDN dependencies** and **browser feature requirements**. The enforced baseline is defined in `scripts/env-detections/browser.js`.

| Browser | Min Version | Release Date | Constrained By           |
|---------|-------------|--------------|--------------------------|
| Chrome  | ≥ 80        | 2020-02-04   | Optional chaining (`?.`) |
| Edge    | ≥ 80        | 2020-02-07   | Optional chaining (`?.`) |
| Firefox | ≥ 74        | 2020-03-10   | Optional chaining (`?.`) |
| Opera   | ≥ 67        | 2020-02-25   | Optional chaining (`?.`) |
| Safari  | ≥ 14        | 2020-09-16   | WebP                     |

#### 1.3.1 Per-Dependency Minimum Browser Versions

| Dependency             | Chrome | Edge   | Firefox | Opera  | Safari |
|------------------------|--------|--------|---------|--------|--------|
| Bootstrap 5.3.8 CSS/JS | **60** | **79** | **60**  | **47** | **12** |
| QRCode.js 1.0.0        | 1      | 12     | 1.5     | 9      | 3      |
| html-to-image 1.11.13  | 32     | 12     | 29      | 20     | 7.1    |
| html2canvas 1.4.1      | 1      | 12     | 3.5     | 12     | 6      |
| @popperjs/core 2.11.8  | **60** | **79** | **60**  | **47** | **12** |

> **Sources**:
> - Bootstrap 5.3.8: [Browsers and devices](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/) - `.browserslistrc` (`Chrome >= 60, Firefox >= 60, Safari >= 12`); IE11 and legacy EdgeHTML not supported
> - QRCode.js 1.0.0: [npm](https://www.npmjs.com/package/qrcodejs) - README claims compatibility with "IE6~10, Chrome, Firefox, Safari, Opera"
> - html-to-image 1.11.13: [GitHub README](https://github.com/bubkoo/html-to-image) - requires `Promise` + SVG `<foreignObject>`
> - html2canvas 1.4.1: [Docs](https://html2canvas.hertzen.com/documentation) - "Chrome all, Firefox 3.5+, Safari 6+, Opera 12+"
> - @popperjs/core 2.11.8: [npm](https://www.npmjs.com/package/@popperjs/core/v/2.11.8) / [Floating UI docs](https://floating-ui.com/) - aligned with Bootstrap 5

#### 1.3.2 Browser Feature Requirements

The following browser features are required by this project. Their minimum browser versions are determined by [Can I Use](https://caniuse.com/) support tables (full support across all usage, not partial or behind a flag).

| Feature                                                                                    | Used By                   | Chrome | Edge   | Firefox | Opera  | Safari |
|--------------------------------------------------------------------------------------------|---------------------------|--------|--------|---------|--------|--------|
| [Optional chaining (`?.`)](https://caniuse.com/mdn-javascript_operators_optional_chaining) | `link-cards-generator.js` | **80** | **80** | **74**  | **67** | 13.1   |
| [WebP](https://caniuse.com/webp)                                                           | Image assets              | 32     | 18     | 65      | 19     | **14** |
| [WOFF 2](https://caniuse.com/woff2)                                                        | Bootstrap Icons           | 36     | 14     | 39      | 23     | 10     |
| [Variable fonts](https://caniuse.com/variable-fonts)                                       | Inter                     | 66     | 17     | 62      | 53     | 11     |

### 1.4 Deployment

- **Platform**: GitHub Pages
- **Build step**: None: raw HTML/CSS/JS served directly from the repository root.

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

Although all `--bs-border-radius*` settings in `stylesheets/modern/base.css` are 0px, it's still best to choose the border-radius size according to Bootstrap conventions.

### 2.3 JavaScript

| Category              | Convention             | Examples                                    |
|-----------------------|------------------------|---------------------------------------------|
| Variables             | `camelCase`            | `currentLang`, `supportedLangs`, `langData` |
| Functions             | `camelCase`            | `loadAllComponents`, `updatePageText`       |
| Constants (top-level) | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES`, `EXCLUDED_PAGES`          |
| DOM element refs      | `camelCase`            | `htmlElement`, `prefersColorScheme`         |

#### 2.3.1 Function Naming by Category

| Prefix       | Purpose                              | Examples                                                                                            |
|--------------|--------------------------------------|-----------------------------------------------------------------------------------------------------|
| `init*`      | Initialize / set up listeners        | `initThemePreference`, `initSkipButton`, `initAllTooltips`, `initAllScrollHints`, `initPageContent` |
| `dispose*`   | Tear down / remove listeners         | `disposeTooltip`, `disposeCopyLinkTooltip`, `disposeAllTooltips`                                    |
| `create*`    | Create and inject a DOM element      | `createTooltip`, `createScrollHint`                                                                 |
| `remove*`    | Remove a DOM element or attribute    | `removeScrollHint`, `removeExternalLinkIndicator`, `removeExternalLinkTargetBehavior`               |
| `add*`       | Add a DOM element or attribute       | `addExternalLinkIndicator`, `addExternalLinkTargetBehavior`                                         |
| `mark*`      | Set or clear a visual state marker   | `markImageLoaded`, `markImageUnloaded`                                                              |
| `handle*`    | DOM event handler (named function)   | `handleCopyLinkClick`, `handleTitleLinkAnchorClick`                                                 |
| `load*`      | Async data fetching                  | `loadSupportedLangs`, `loadLang`, `loadAllComponents`, `loadHTML`                                   |
| `update*`    | Update existing DOM content          | `updatePageText`, `updatePageTitle`, `updateThemeToggleText`                                        |
| `apply*`     | Apply a setting / style change       | `applyThemePreference`, `applyAllThemeBasedImages`, `applyAllExternalLinkTargetBehavior`            |
| `get*`       | Retrieve / compute a value           | `getSystemTheme`                                                                                    |
| `set*`       | Set a state / attribute              | `setActiveNavItem`, `setActiveLangItem`, `setActiveThemeItem`                                       |
| `populate*`  | Fill UI lists / menus                | `populateLanguageMenus`                                                                             |
| `generate*`  | Create and inject DOM elements       | `generateLinkCards`                                                                                 |
| `hide*`      | Hide an element                      | `hideLoadingScreen`                                                                                 |
| `extract*`   | Parse / derive from input            | `extractPageName`                                                                                   |
| `normalize*` | Normalize / sanitize input           | `normalizeInternalPath`                                                                             |

> Prefer existing prefixes when adding new functions. If none fit, use a clear descriptive verb.

#### 2.3.2 Batch Functions Must Delegate to Single-Element Functions

A **batch function** is a function that queries multiple DOM elements and applies the same operation to each one. The per-element logic **must** be extracted into a reusable single-element function. The batch function then delegates to it.

- Batch function names **must** include `All` before the noun (e.g. `initAllTooltips()`, `applyAllThemeBasedImages()`).
- The corresponding single-element function describes the per-element action (e.g. `createTooltip(el)`, `applyThemeBasedImage(img)`).
- The single-element function should be **idempotent** (safe to call multiple times on the same element).
- Functions without a corresponding single-element function (pure event delegation, singleton initialization, etc.) do not need `All` in their name.

#### 2.3.3 Single-Element Functions Must Have Symmetric Counterparts

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
| `createTooltip(el)`                   | `disposeTooltip(el)`                     | `tooltips.js`      |
| `initCopyLinkTooltip(link)`           | `disposeCopyLinkTooltip(link)`           | `tooltips.js`      |
| `markImageLoaded(img)`                | `markImageUnloaded(img)`                 | `img-utils.js`     |
| `addExternalLinkIndicator(link)`      | `removeExternalLinkIndicator(link)`      | `accessibility.js` |
| `initTitleLinkAnchor(anchor)`         | `disposeTitleLinkAnchor(anchor)`         | `accessibility.js` |
| `createScrollHint(group)`             | `removeScrollHint(group)`                | `scroll-hint.js`   |
| `addExternalLinkTargetBehavior(link)` | `removeExternalLinkTargetBehavior(link)` | `settings.js`      |

**Handler extraction rule:** If an `init*` function uses `addEventListener` with an anonymous function, the handler **must** be extracted as a named `handle*` function so the corresponding `dispose*` function can call `removeEventListener` with the same reference.

Existing batch / single-element pairs:

| Batch Function                         | Single-Element Function              | Module                |
|----------------------------------------|--------------------------------------|-----------------------|
| `initAllTooltips()`                    | `createTooltip(el)`                  | `tooltips.js`         |
| `disposeAllTooltips()`                 | `disposeTooltip(el)`                 | `tooltips.js`         |
| `initAllCopyLinkTooltips()`            | `initCopyLinkTooltip(link)`          | `tooltips.js`         |
| `initAllColoredImages()`               | `applyColoredImage(img)`             | `img-utils.js`        |
| `initAllImageLoadingOpacity()`         | `initImageLoadingOpacity(img)`       | `img-utils.js`        |
| `applyAllThemeBasedImages()`           | `applyThemeBasedImage(img)`          | `theme.js`            |
| `applyAllFaviconThemes()`              | `applyFaviconTheme(link)`            | `theme.js`            |
| `addAllExternalLinkIndicators()`       | `addExternalLinkIndicator(link)`     | `accessibility.js`    |
| `initAllTitleLinkAnchors()`            | `initTitleLinkAnchor(anchor)`        | `accessibility.js`    |
| `initAllScrollHints()`                 | `createScrollHint(group)`            | `scroll-hint.js`      |
| `applyAllExternalLinkTargetBehavior()` | `addExternalLinkTargetBehavior(link)`| `settings.js`         |
| `loadAllComponents()`                  | `loadHTML(placeholder, name)`        | `component-loader.js` |

---

## 3. Project Structural Constraints

### 3.1 Folder Overview

| Folder                    | Purpose                                                       | Where to Add New Code                                 |
|---------------------------|---------------------------------------------------------------|-------------------------------------------------------|
| `.github/`                | GitHub-specific configurations (Copilot instructions, etc.)   | -                                                     |
| `configs/`                | JSON configuration data for i18n and link cards               | New JSON config files as needed                       |
| `configs/i18n/`           | Translation JSON files, one per language                      | New translation file for each added language          |
| `configs/links/`          | Link-card data JSON files, one per page                       | New link-card JSON when adding a page with link cards |
| `images/`                 | Image assets (icons, covers, stickers, placeholder)           | New images in the appropriate sub-folder              |
| `images/covers/`          | Cover images for link cards and share cards                   | Cover image files                                     |
| `images/favicons/`        | Favicon and PWA icon assets (SVG, PNG, ICO)                   | New favicon variant                                   |
| `images/icons/`           | Icon images for link cards                                    | Icon image files                                      |
| `images/stickers/`        | Sticker images                                                | Sticker image files                                   |
| `images/svg/`             | SVG icon/image files for runtime injection                    | New SVG file when adding a vector graphic             |
| `page-components/`        | HTML fragments loaded at runtime by the component loader      | New HTML fragment                                     |
| `scripts/`                | JS entry points (`init-*.js`, `env-detection.js`)             | New init script if a new page tier is needed          |
| `scripts/env-detections/` | Reusable JS modules (ES5) - **define only, never execute**    | New env-detection module                              |
| `scripts/functions/`      | Reusable JS modules (ES2020) - **define only, never execute** | New JS module file, or add to an existing file        |
| `stylesheets/`            | CSS stylesheets                                               | New CSS file in the appropriate sub-folder            |
| `stylesheets/modern/`     | CSS modules using modern CSS specifications - for all pages   | New CSS module, or add to an existing file            |
| `stylesheets/minimal/`    | CSS with broad compatibility (IE 11) - for error pages only   | New minimal stylesheet                                |
| Root `*.xml`              | Sitemap and other XML config files                            | -                                                     |
| Root `*.json`             | PWA manifest and other root JSON configs                      | -                                                     |
| Root `*.html`             | Page files (homepage, sub-pages, error pages)                 | New page file when adding a page                      |

**File placement rules**:

- Put JS functions in `scripts/functions/` or `scripts/env-detections/` - either in a relevant existing file or a new file.
    - Use `scripts/env-detections/` for ES5 scripts (e.g. browser/environment detection that runs before the page renders).
    - Use `scripts/functions/` for ES2020 scripts (general-purpose reusable modules).
- Put CSS in `stylesheets/modern/` - either in a relevant existing file or a new file.
    - Use `stylesheets/modern/` for all normal page stylesheets (modern CSS).
    - Use `stylesheets/minimal/` only for error pages that must support IE 11.
- If a feature needs both JS and CSS, create matching file names (e.g., `foo.js` + `foo.css`). If the CSS is general-purpose, it can go into `components.css` instead.
- Put JSON configuration data in `configs/` under the appropriate sub-folder.
- Put reusable HTML fragments in `page-components/`.

### 3.2 General File Rules

#### 3.2.1 `scripts/env-detections/` and `scripts/functions/`: Define Only, Never Execute

- Files in `scripts/env-detections/` must **only define variables and functions**, using **ES5** syntax.
- Files in `scripts/functions/` must **only define variables and functions**, using **ES2020** syntax.
- Every global variable and function **must have JSDoc** written for it.
- They must **NOT** contain top-level function calls or self-executing code.
- A function defined here should never call itself at the top level of the file.
- All execution / wiring happens in the `init-*.js` entry points.

```js
// In scripts/functions/example.js:

// CORRECT:

/** @type {number} This is a global number variable. */
var num1 = 1;

/**
 * This function will do something.
 */
function doSomething() { /* ... */ }

// WRONG:
doSomething();  // No top-level execution!
document.addEventListener('DOMContentLoaded', doSomething);  // No!
```

#### 3.2.2 `scripts/init-*.js`: Entry Points, Wire Everything

- These files import functions from `scripts/functions/` and `scripts/env-detections/` and call them in the correct order.
- `env-detection.js`: Perform basic browser/environment detection before starting to load the page. Runs before `<head>`. Uses functions defined in `scripts/env-detections/`.
- `init-at-head.js`: Runs synchronously in `<head>`.
- `init-final.js`: Full initialization on `DOMContentLoaded`. Loads components, i18n, settings, page transitions, etc.
- `init-final-lightweight.js`: Cut-down version. Does not load the Page Transition System.

#### 3.2.3 `stylesheets/`: Two Sub-Folders, One Commenting Convention

- **`stylesheets/modern/`** — CSS modules for all normal pages. Uses modern CSS specifications.
- **`stylesheets/minimal/`** — Broad compatibility CSS for error pages (supports IE 11).

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

- **Full Functionality Pages**: Use `init-final.js`.
    - `index`
    - `about`
    - `artworks-and-videos`
    - `blogs-and-sponsor`
    - `chatting`
    - `softwares`
- **Error Pages**: Use `init-final-lightweight.js`.
    - `404`: The redirected page when an HTTP 404 occurs.
- **Error Pages with Minimal External Reference (`error-*`)**: These pages don't rely on any external JS scripts, external CSS stylesheets (except `/stylesheets/minimal/base.css`) or external CDNs, which means that they don't use features such as i18n or the Page Transition System. The page layout should be as close to Bootstrap 5.3 as possible, but can be appropriately simplified.
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

### 4.1 Browser Detection & Compatibility Fallbacks

**Brief**: Detects the user's browser and redirects to `error-unsupported-browser.html` if it does not meet the minimum baseline. Verifies that Bootstrap CSS loaded correctly. Also handles the case where JavaScript is disabled by redirecting to `error-javascript-disabled.html`. Known search engine bots, crawlers, and SEO tools are whitelisted via `isBotOrCrawler()` to prevent them from being falsely redirected (see [§4.16.8](#4168-crawler-whitelist)).

**Related Files**:

| File                                           | Role                                                                                     |
|------------------------------------------------|------------------------------------------------------------------------------------------|
| `scripts/env-detection.js`                     | Runs before page load; performs basic environment checks                                 |
| `scripts/env-detections/browser.js`            | Browser version detection and redirection logic (written in ES5 for broad compatibility) |
| `scripts/functions/bootstrap-css-detection.js` | Verifies Bootstrap CSS loaded successfully                                               |
| `error-unsupported-browser.html`               | Fallback page for unsupported browsers                                                   |
| `error-javascript-disabled.html`               | Fallback page displayed when JavaScript is disabled                                      |

> `browser.js` is executed first among all scripts. It is written in ES5 to ensure it runs even on older browsers.

**Data Flow**:

- `browser.js` checks `navigator.userAgent` against the browser baseline table (see [§1.3 Browser Baseline](#13-browser-baseline)).
- Before version detection, `isBotOrCrawler()` checks whether the User-Agent belongs to a known search engine bot, crawler, or SEO tool. If so, the browser is always treated as supported (see [§4.16.8](#4168-crawler-whitelist)).
- If unsupported: redirects to `error-unsupported-browser.html`.
- `bootstrap-css-detection.js` checks that Bootstrap CSS is applied; shows a warning if not.

**JavaScript Disabled Fallback**:

- Every full-functionality page and `404.html` includes a `<noscript>` meta-refresh in `<head>`:

    ```html
    <noscript>
        <meta http-equiv="refresh" content="0;url=/error-javascript-disabled.html">
    </noscript>
    ```

- This redirect happens before any external resources are loaded, ensuring the fallback page is shown even when CDN scripts are unavailable.

---

### 4.2 Component Loading

**Brief**: Dynamically loads reusable HTML fragments (header, footer, modals) into placeholder elements on each page.

**Related Files**:

| File                                          | Role                                |
|-----------------------------------------------|-------------------------------------|
| `scripts/functions/component-loader.js`       | Fetches and injects HTML fragments  |
| `page-components/header.html`                 | Header fragment                     |
| `page-components/footer.html`                 | Footer fragment (full pages)        |
| `page-components/footer-lightweight.html`     | Footer fragment (lightweight pages) |
| `page-components/modals.html`                 | Settings and QR code modals         |

**How It Works**:

```
HTML: <div data-role="page-component" data-component-name="header"></div>
        ↓ (component-loader.js at init time)
      Reads data-component-name="header" → fetches /page-components/header.html → injects innerHTML
```

- Elements with `data-role="page-component"` serve as placeholders.
- The component loader reads `data-component-name` to derive the file path: `/page-components/{name}.html`.
- The `data-component-name` value must match the HTML fragment filename (without extension).

---

### 4.3 Internationalization (i18n)

**Brief**: Provides multi-language support for all user-facing text. Translations are stored in JSON files and applied at runtime by rewriting DOM elements with `data-i18n` attributes.

**Related Files**:

| File                         | Role                                                  |
|------------------------------|-------------------------------------------------------|
| `scripts/functions/i18n.js`  | Language loading, text replacement, language switcher |
| `configs/language-list.json` | List of supported language codes                      |
| `configs/i18n/{lang}.json`   | Translation key-value pairs for each language         |

**How It Works**:

```
HTML: <span data-i18n="text-welcome">Welcome</span>
        ↓ (i18n.js loads configs/i18n/{lang}.json)
      Replaces textContent with translated value

Rich text: <span data-i18n-html="text-intro">Intro with <cite>Title</cite></span>
        ↓ (updatePageText() rewrites innerHTML from langData, preserving inline markup)

Tooltips: <a data-bs-toggle="tooltip" data-i18n-tooltip="text-foo" data-bs-title="Foo">
        ↓ (updatePageText() rewrites data-bs-title from langData)

Alt text: <img alt="Illustration" data-i18n-alt="text-illustration" src="...">
        ↓ (updatePageText() rewrites alt from langData)
```

#### 4.3.1 i18n Key Naming Conventions

- Keys use `dash-case` naming (e.g. `text-welcome`, `text-learn-more`, `text-http-404-description`).
- All i18n keys for user-facing text **must** use the `text-` prefix. This allows keys to be reused across different contexts - the same key can serve `data-i18n`, `data-i18n-alt`, or `data-i18n-tooltip` on different elements.
- For `<img>` alt attributes: use `data-i18n-alt` (e.g. `data-i18n-alt="text-illustration"`).
- For tooltip-only translations: use `data-i18n-tooltip` (e.g. `data-i18n-tooltip="text-settings"`).
- For translations that contain inline HTML markup (e.g. `<cite>`, `<em>`, `<strong>`): use `data-i18n-html` (e.g. `data-i18n-html="text-videos-description"`). The translation string is applied via `innerHTML` rather than `textContent`, so HTML tags are rendered as elements. Only use this when inline markup is required; prefer `data-i18n` for plain text.
- Proper nouns that are identical across all supported languages (e.g. "Pixiv", "GitHub", "QQ") do not need i18n keys - simply use the original text directly in `alt` or `data-bs-title` without a `data-i18n-*` attribute. Do not add these to the translation JSON files.

**Configuration**: Translation JSON files are flat key-value objects. Every `text-*` key used in HTML must have a corresponding entry in every language file. The keys should be arranged in alphabetical order.

**Data Flow**:

| Mechanism      | Key              | Purpose                            |
|----------------|------------------|------------------------------------|
| `localStorage` | `preferredLang`  | Persist language preference        |
| Global var     | `currentLang`    | Currently loaded language code     |
| Global var     | `langData`       | Loaded translation key-value pairs |
| Global var     | `supportedLangs` | Array of available language codes  |

---

### 4.4 Theme System

**Brief**: Supports light, dark, and auto (follow OS) color themes using Bootstrap's `data-bs-theme` attribute. Custom brand colors are defined via `--shlh-*` CSS custom properties. Also handles favicon switching between light/dark variants when the theme changes.

**Related Files**:

| File                                | Role                                                                      |
|-------------------------------------|---------------------------------------------------------------------------|
| `scripts/functions/theme.js`        | Theme initialization, switching, system theme listener, and favicon theme |
| `stylesheets/modern/theme.css`      | Theme-specific CSS custom property overrides                              |
| `stylesheets/modern/base.css`       | Base styles including `--bs-border-radius` overrides and shared variables |
| `images/favicons/general.svg`       | Light-theme favicon (blue `#3c96ff`)                                      |
| `images/favicons/general-dark.svg`  | Dark-theme favicon (white)                                                |

**How It Works**:

- Uses Bootstrap's `data-bs-theme` attribute on `<html>`.
- Three modes: `auto` (follow OS), `light`, `dark`.
- System theme changes listened via `matchMedia('(prefers-color-scheme: dark)')`.
- Custom CSS variables prefixed `--shlh-` define brand colors per theme.
- Favicon `<link>` hrefs are swapped between `general.svg` (light) and `general-dark.svg` (dark) by `applyAllFaviconThemes()`.

#### 4.4.1 Color Variable Naming

Color-related CSS custom properties use the `--shlh-*` prefix with the following patterns:

- **Standard**: `--shlh-{type}(-rgb)`
    - Similar to Bootstrap's naming, e.g. `--shlh-primary`, `--shlh-primary-rgb`.
    - Add the `-color` suffix to indicate a foreground color, e.g. `--shlh-primary-color`.
- **Color Brightness**: `--shlh-{type}-{brightness}(-rgb)`
    - **Type**: Similar to Bootstrap, e.g. `primary`, `secondary`.
    - **Brightness**: A number from 100–900 (bright to dark).
    - **Full examples**: `--shlh-primary-500`, `--shlh-primary-500-rgb`.

See [§2.2.1](#221-project-specific) for the overall `--shlh-*` prefix definition.

**Data Flow**:

| Mechanism      | Key                      | Purpose                                                  |
|----------------|--------------------------|----------------------------------------------------------|
| `localStorage` | `bsTheme`                | Persist theme preference (`'auto'`, `'light'`, `'dark'`) |
| Global var     | `currentThemePreference` | Current theme choice                                     |

---

### 4.5 Link Cards

**Brief**: Renders link-card groups from JSON configuration files. Each page with link cards has a corresponding JSON file in `configs/links/`.

**Related Files**:

| File                                        | Role                                            |
|---------------------------------------------|-------------------------------------------------|
| `scripts/functions/link-cards-generator.js` | Generates link-card DOM elements from JSON data |
| `configs/links/{page-name}.json`            | Link-card group definitions for each page       |

#### 4.5.1 JSON Structural Standards

The JSON format uses a consistent pattern for representing HTML elements:

- **Element descriptor**: An object with `content` (text or HTML content), optional `properties` (HTML attributes), and optional `isHtml` (boolean). The special key `classes` inside `properties` specifies CSS class names as an array. When `isHtml` is `true`, the content is rendered via `innerHTML`; otherwise `textContent` is used.

    ```json
    // <span> element:
    {
        "content": "My personal email",
        "properties": {
            "data-i18n": "text-my-personal-email"
        }
    }
    // → <span data-i18n="text-my-personal-email">My personal email</span>

    // <span> element with inline HTML (isHtml + data-i18n-html):
    {
        "content": "The game <cite>Minecraft</cite>.",
        "properties": {
            "data-i18n-html": "text-videos-description"
        },
        "isHtml": true
    }
    // → <span data-i18n-html="text-videos-description">The game <cite>Minecraft</cite>.</span>

    // <img> element (colored mask-based icon):
    {
        "properties": {
            "alt": "Email",
            "data-i18n-alt": "text-email",
            "src": "/images/null.png",
            "data-img-feature": "colored",
            "data-src-mask": "/images/icons/email.webp",
            "data-color-var": "bs-body-color"
        }
    }
    // → <img alt="Email" data-i18n-alt="text-email"   src="/images/null.png" data-img-feature="colored" data-src-mask="/images/icons/email.webp" data-color-var="bs-body-color">

    // <img> element (theme-following image):
    {
        "properties": {
            "alt": "Illustration",
            "src": "/images/covers/illustration-light.webp",
            "data-img-feature": "follow-theme",
            "data-src-light": "/images/covers/illustration-light.webp",
            "data-src-dark": "/images/covers/illustration-dark.webp"
        }
    }
    // → <img alt="Illustration" src="/images/covers/illustration-light.webp" data-img-feature="follow-theme" data-src-light="/images/covers/illustration-light.webp" data-src-dark="/images/covers/illustration-dark.webp">
    ```

- **Text Fragment**: A group of `<span>` elements, optionally wrapped in an `<a>`:

    ```json
    {
        "superLink": true,
        "text": [
            {
                "content": "My personal email",
                "properties": { "data-i18n": "text-my-personal-email" }
            }
        ],
        "properties": {
            "href": "mailto:stevehsudrawing@outlook.com",
            "classes": [ "external-link" ]
        }
    }
    ```

    - `superLink`: If `true`, wraps the text spans in an `<a>` element with the given `properties`. If `false`, only the `<span>` elements from `text` are rendered, and this key can also be ignored.
    - `text`: Array of `<span>` element descriptors.
    - `properties`: Attributes for the `<a>` element (only when `superLink` is `true`).

- **Link Card**:

    ```json
    {
        "available": true,
        "icon": {
            "properties": {
                "alt": "Pixiv",
                "src": "/images/icons/pixiv.webp"
            }
        },
        "title": [
            {
                "superLink": true,
                "text": [{ "content": "Pixiv" }],
                "properties": {
                    "href": "https://www.pixiv.net/users/70732361",
                    "classes": [ "external-link" ]
                }
            }
        ],
        "description": [
            {
                "superLink": false,
                "text": [{ "content": "UID: 70732361" }]
            }
        ]
    }
    ```

    - `available`: Boolean. When not `true`, the card gets class `opacity-75`.
    - `icon`: An `<img>` element descriptor for the card icon.
    - `title`: Array of Text Fragments composing the card title.
    - `description`: Array of Text Fragments composing the card description.

- **Link Card Group** (top-level structure in each JSON file):

    ```json
    {
        "title": [
            {
                "content": "Artworks",
                "properties": { "data-i18n": "text-artworks" }
            }
        ],
        "description": [ /* optional Text Fragments */ ],
        "contents": [ /* array of Link Cards */ ]
    }
    ```

    - `title`: Array of `<span>` element descriptors for the group heading (`<h4>`).
    - `description`: Optional; array of Text Fragments for a group description.
    - `contents`: Array of Link Cards.

**Interaction with Other Systems**:

- **i18n ([§4.3](#43-internationalization-i18n))**: Generated cards contain `data-i18n` or `data-i18n-html` attributes; `updatePageText()` must be called after card generation to apply translations.
- **QR Code ([§4.10](#410-qr-code--export))**: "super link" fragments generate adjacent QR-code buttons that call `showQRCodeModal()`.
- **Image Utilities ([§4.13](#413-image-utilities))**: Card icons may use `data-img-feature="colored"` (mask-based coloring) or `"follow-theme"` (dark/light variant swapping).
- **Utilities ([§4.15](#415-utilities))**: Uses `setElementAttributes()` to apply element properties and `extractPageName()` to resolve the JSON config path.
- **External Link Confirmation ([§4.17](#417-external-link-confirmation))**: Links generated with `.external-link` class will trigger the confirmation modal on click.
- **Page Transition ([§4.6](#46-page-transitions))**: Links generated with `.internal-link` class will trigger SPA-style page navigation.

---

### 4.6 Page Transitions

**Brief**: Provides SPA-style animated transitions when navigating between internal pages.

**Related Files**:

| File                                     | Role                                                          |
|------------------------------------------|---------------------------------------------------------------|
| `scripts/functions/page-transition.js`   | Intercepts internal link clicks, manages transition animation |
| `stylesheets/modern/page-transition.css` | Progress bar and content dimming styles                       |

**How It Works**:

- Internal links (`class="internal-link"`) trigger SPA-style transitions instead of full page reloads.
- A progress bar (`#page-transition-progress`) animates at the top of the viewport.
- Content is dimmed during the transition.
- On lightweight pages (`404.html`), the Page Transition System is not loaded.

**Interaction with Other Systems**:

- **Utilities ([§4.15](#415-utilities))**: Depends on `isInternalPage()`, `normalizeInternalPath()`, `INTERNAL_PAGES`, and `EXCLUDED_PAGES` (defined in `utils.js`) for link classification and path resolution.
- **Tooltips ([§4.12](#412-tooltips))**: Calls `disposeAllTooltips()` before each transition to prevent orphaned tooltip instances.
- **External Link Confirmation ([§4.17](#417-external-link-confirmation))**: `shouldInterceptLink()` returns `false` for `.external-link` links, allowing the confirmation system to take over. The confirmation system uses `isInternalPage()` from `utils.js` to avoid false positives.
- **Settings ([§4.8](#48-settings--preferences))**: After a page transition, `initPageContent()` re-invokes `initSettingsModal()` to re-sync toggle states with the recreated DOM.
- **i18n ([§4.3](#43-internationalization-i18n))**: After a page transition, `initPageContent()` calls `updatePageText()` and `updatePageTitle()` to apply translations to the new content.
- **Initialization ([§4.7](#47-loading-screen))**: `navigateTo()` restores page content and completes the progress bar on success; on failure, falls back to a full browser navigation (`window.location.href`).

---

### 4.7 Loading Screen

**Brief**: Displays a loading overlay on page load, hidden after all initialization completes.

**Related Files**:

| File                                    | Role                               |
|-----------------------------------------|------------------------------------|
| `scripts/functions/loading-screen.js`   | Controls loading screen visibility |
| `stylesheets/modern/loading-screen.css` | Loading screen overlay styles      |

**Data Flow**:

| Mechanism   | Key / Event       | Purpose                                                                      |
|-------------|-------------------|------------------------------------------------------------------------------|
| CustomEvent | `pageInitialized` | Signals that all init scripts have finished; deferred listeners can then run |
| URL hash    | `#section-id`     | Scroll to anchor after page load (via `initHashChangeScroll()`)              |

---

### 4.8 Settings & Preferences

**Brief**: Manages user-configurable preferences persisted in `localStorage`.

**Related Files**:

| File                            | Role                                                             |
|---------------------------------|------------------------------------------------------------------|
| `scripts/functions/settings.js` | Preference read/write, toggle event handling, applying behaviors |

**Preferences Managed**:

- **"Always open external links in a new tab"**:
    - `localStorage` key: `openExternalLinksInNewTab`.
    - **Default**: enabled - the preference is considered on unless explicitly set to `'false'`.
    - Controlled by a toggle (`#external-links-new-tab-toggle`) in the settings modal.
    - Key functions:
        - `isExternalLinkNewTabEnabled()` - reads the preference.
        - `setExternalLinkNewTabPreference(enabled)` - persists the preference.
        - `applyAllExternalLinkTargetBehavior()` - reads the preference and delegates to `addExternalLinkTargetBehavior(link)` or `removeExternalLinkTargetBehavior(link)` for each `a.external-link` element.
    - The toggle change event is handled by `initSettingEventListeners()`.
    - When the settings modal opens, `initSettingsModal()` syncs the toggle with the stored preference.

- **"Enable animations"**:
    - `localStorage` key: `enableAnimations`.
    - **Default**: enabled - the preference is considered on unless explicitly set to `'false'`.
    - Controlled by a toggle (`#enable-animations-toggle`) in the settings modal.
    - When disabled, the `applyAnimationPreference()` function adds the `.no-animations` class to `<html>`, which triggers a global CSS rule (in `stylesheets/modern/base.css`) that sets `transition: none !important` and `animation: none !important` on all elements.
    - Key functions:
        - `isAnimationEnabled()` - reads the preference.
        - `setAnimationPreference(enabled)` - persists the preference.
        - `applyAnimationPreference()` - toggles the `.no-animations` class on `<html>`.
        - `updateAnimationToggleState()` - checks `matchMedia('(prefers-reduced-motion: reduce)')`; when the OS-level reduced-motion setting is active, disables the toggle (`disabled + unchecked`) and displays a tooltip on the label (i18n key `text-animations-disabled-by-system-description`) explaining that the system setting overrides this option. Listens for changes to the OS setting via `matchMedia(...).addEventListener('change', ...)`.
    - CSS rules (in `stylesheets/modern/base.css`): two independent paths disable animations — the `@media (prefers-reduced-motion: reduce)` query (OS-level) and the `.no-animations` class (manual). Both use the same `transition: none !important; animation: none !important` approach.
    - The toggle change event is handled by `initSettingEventListeners()`.
    - When the settings modal opens, `initSettingsModal()` syncs the toggle with the stored preference and system state.

**Data Flow**:

| Mechanism      | Key                         | Purpose                                  |
|----------------|-----------------------------|------------------------------------------|
| `localStorage` | `openExternalLinksInNewTab` | Persist external link new-tab preference |
| `localStorage` | `enableAnimations`          | Persist animation preference             |

> Language and theme preferences are managed by their respective modules (see [§4.3](#43-internationalization-i18n) and [§4.4](#44-theme-system)).

**Interaction with Other Systems**:

- **i18n ([§4.3](#43-internationalization-i18n))**: The language selector (`#language-select`) in the settings modal triggers `loadLang()` on change.
- **Theme ([§4.4](#44-theme-system))**: Theme buttons (`.theme-item`) in the settings modal call `setThemePreference()` on click.
- **External Link Confirmation ([§4.17](#417-external-link-confirmation))**: The `openExternalLinksInNewTab` preference is shared between the settings modal toggle (`#external-links-new-tab-toggle`) and the confirmation modal toggle (`#external-link-new-tab-toggle`). The confirmation module calls `isExternalLinkNewTabEnabled()` / `setExternalLinkNewTabPreference()` / `applyAllExternalLinkTargetBehavior()` from this module.
- **Page Transition ([§4.6](#46-page-transitions))**: `initSettingsModal()` is re-invoked after each SPA transition (via `initPageContent()`) to re-sync toggle DOM elements with stored preferences.

---

### 4.9 Navigation & Accessibility

**Brief**: Handles navbar active state, scroll hint indicator, skip-to-content button, and keyboard/mouse focus distinction.

**Related Files**:

| File                                   | Role                                                                        |
|----------------------------------------|-----------------------------------------------------------------------------|
| `scripts/functions/navbar.js`          | Active nav item highlighting                                                |
| `scripts/functions/scroll-hint.js`     | Scroll-down hint indicator                                                  |
| `scripts/functions/accessibility.js`   | Skip button, focus management, external link indicators, title link anchors |
| `stylesheets/modern/navbar.css`        | Navbar styles                                                               |
| `stylesheets/modern/scroll-hint.css`   | Scroll hint styles                                                          |
| `stylesheets/modern/accessibility.css` | Skip button and focus styles                                                |

**Features**:

- **Skip button** (`#skip-button`): Allows keyboard users to skip navigation and jump to main content.
- **Focus management**: CSS distinguishes keyboard focus (`.user-input-keyboard #skip-button:focus`) from mouse focus (`:focus-visible`).
- **Language attribute**: The `lang` attribute on `<html>` should reflect the current language.

---

### 4.10 QR Code & Export

**Brief**: Generates a branded QR code share card and allows downloading it as a PNG image.

**Related Files**:

| File                             | Role                                                |
|----------------------------------|-----------------------------------------------------|
| `scripts/functions/qr-code.js`   | QR code generation, share card assembly, PNG export |
| `stylesheets/modern/qr-code.css` | Share card layout styles                            |

**How It Works**:

- QR Code is generated dynamically via QRCode.js inside a branded share card (logo + site name).
- Can be downloaded as a PNG image via `html-to-image`, with `html2canvas` fallback for mobile browsers.

---

### 4.11 Fonts & Typography

**Brief**: Defines comprehensive font stacks for body text, headings, monospace code, and emoji across all supported languages. The actual font stacks are assembled in `stylesheets/modern/fonts.css` using `--shlh-font-*` CSS custom properties.

**Related Files**:

| File                           | Role                                                                     |
|--------------------------------|--------------------------------------------------------------------------|
| `stylesheets/modern/fonts.css` | Font-face declarations and per-element, per-language font stack assembly |

#### 4.11.1 Font Variable Naming

Font-related CSS custom properties use the `--shlh-*` prefix with the following pattern:

`--shlh-font-{category}-{priority}-{language}`

- **Category**:
    - `sans-serif-text` - body
    - `sans-serif-display` - headings
    - `monospace` - code
- **Priority**:
    - `major` - Preferred fonts, listed first in the stack
    - `fallback` - Secondary fallback fonts, arranged as needed
    - `system`  - OS-level generic family, e.g. `ui-monospace`, `-apple-system`
- **Language**:
    - `en` - English / Latin
    - `ja` - Japanese / CJK Compatible
    - `zh-Hans`,`zh-Hant`, etc.

**Full examples**:
- `--shlh-font-sans-serif-text-major-en`: preferred body font stack for English / Latin
- `--shlh-font-monospace-fallback-zh-Hans`: fallback monospace stack for Simplified Chinese

**Special Variables**:
- `--shlh-font-{category}-system`: System fallback. Such variables are considered language-independent.
- `--shlh-font-emoji`: Emoji font stack. Emoji is considered unrelated to all three of the above entries.

Font stacks are assembled per-element (body, h1, code) and per-lang (`html[lang='zh-Hans']`, etc.) in `stylesheets/modern/fonts.css`. See that file for the exact composition of each stack.

See [§2.2.1](#221-project-specific) for the overall `--shlh-*` prefix definition.

#### 4.11.2 Font Stack Design

- **Font arrangement constraint**: If a font has a localized name, the localized name is placed first, followed by the general Western name.
- The detailed per-language, per-platform font preference tables below define the canonical font lists. The actual CSS in `fonts.css` is the authoritative source.

<details>
<summary><code>sans-serif-text-major</code> (body text preferred fonts)</summary>

| Language  | Preferred                                       | Apple                                                                     | Chromium / Android / Linux                                                               | Windows                                                     |
|-----------|-------------------------------------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| `en`      | `Inter Variable Text`, `InterVariable`, `Inter` | `SF Pro`, `SF Pro Text`, `SF Text`, `San Francisco Text`, `San Francisco` | `Roboto Flex`, `Roboto`, `Noto Sans`                                                     | `Segoe UI Variable Text`, `Segoe UI`                        |
| `ja`      | `更紗ゴシック J`, `Sarasa Gothic J`             | `ヒラギノ角ゴシック`, `Hiragino Sans`                                     | `Noto Sans JP`, `Noto Sans CJK JP`, `Noto Sans CJK`, `源ノ角ゴシック`, `Source Han Sans` | `Meiryo UI`, `メイリオ`, `Meiryo`                           |
| `zh-Hans` | `更纱黑体 SC`, `Sarasa Gothic SC`               | `苹方-简`, `PingFang SC`, `苹方`, `PingFang`                              | `Noto Sans SC`, `Noto Sans CJK SC`, `思源黑体`, `Source Han Sans SC`                     | `Microsoft YaHei UI`, `微软雅黑`, `Microsoft YaHei`         |
| `zh-Hant` | `更紗黑體 TC`, `Sarasa Gothic TC`               | `蘋方-繁`, `PingFang TC`, `蘋方`, `PingFang`                              | `Noto Sans TC`, `Noto Sans CJK TC`, `思源黑體`, `Source Han Sans TC`                     | `Microsoft JhengHei UI`, `微軟正黑體`, `Microsoft JhengHei` |

</details>

<details>
<summary><code>sans-serif-text-fallback</code> (body text fallback fonts)</summary>

| Language  | Apple                                                                      | Android / Linux                                                                                                                                  | Windows / General                                   |
|-----------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `en`      | `Helvetica Neue`, `Helvetica`                                              | `Liberation Sans`, `DejaVu Sans`, `Droid Sans`                                                                                                   | `Tahoma`, `Geneva`, `Verdana`, `Arial`              |
| `ja`      | `Osaka`                                                                    | `VL Ｐゴシック`, `VL PGothic`, `IPA ゴシック`, `IPA Gothic`, `さざなみゴシック`, `Sazanami Gothic`, `Droid Sans Japanese`, `Droid Sans Fallback` | `ＭＳ Ｐゴシック`, `MS PGothic`, `Arial Unicode MS` |
| `zh-Hans` | `华文细黑`, `STXihei`, `华文黑体`, `STHeiti`, `黑体-简`, `Heiti SC`, `Hei` | `文泉驿微米黑`, `WenQuanYi Micro Hei`, `文泉驿正黑`, `WenQuanYi Zen Hei`, `Droid Sans Fallback`                                                  | `黑体`, `SimHei`, `宋体`, `SimSun`                  |
| `zh-Hant` | `儷黑 Pro`, `LiHei Pro`, `蘋果儷中黑`, `Apple LiGothic`                    | `文泉驛微米黑`, `WenQuanYi Micro Hei`, `文泉驛正黑`, `WenQuanYi Zen Hei`, `Droid Sans Fallback`                                                  | `新細明體`, `PMingLiU`                              |

</details>

<details>
<summary><code>monospace-major</code> (code preferred fonts)</summary>

| Language  | Preferred                             | Apple                           | Chromium / Android / Linux                                | Windows                          |
|-----------|---------------------------------------|---------------------------------|-----------------------------------------------------------|----------------------------------|
| `en`      | `Iosevka`                             | `SF Mono`, `San Francisco Mono` | `Roboto Mono`, `Noto Sans Mono`                           | `Cascadia Code`, `Cascadia Mono` |
| `ja`      | `更紗等幅ゴシック J`, `Sarasa Mono J` | -                               | `Noto Sans Mono CJK JP`, `源ノ等幅`, `Source Han Mono`    | -                                |
| `zh-Hans` | `等距更纱黑体 SC`, `Sarasa Mono SC`   | -                               | `Noto Sans Mono CJK SC`, `思源等宽`, `Source Han Mono SC` | -                                |
| `zh-Hant` | `等距更紗黑體 TC`, `Sarasa Mono TC`   | -                               | `Noto Sans Mono CJK TC`, `思源等寬`, `Source Han Mono TC` | -                                |

</details>

<details>
<summary><code>monospace-fallback</code> (code fallback fonts)</summary>

| Language  | Apple             | Android / Linux                                                                                 | Windows / General                                      |
|-----------|-------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| `en`      | `Menlo`, `Monaco` | `DejaVu Sans Mono`, `Liberation Mono`, `Droid Sans Mono`, `FreeMono`                            | `Consolas`, `Lucida Console`, `Courier New`, `Courier` |
| `ja`      | `Osaka`           | `VL ゴシック`, `VL Gothic`, `IPA ゴシック`, `IPA Gothic`, `さざなみゴシック`, `Sazanami Gothic` | `ＭＳ ゴシック`, `MS Gothic`                           |
| `zh-Hans` | -                 | `文泉驿等宽微米黑`, `WenQuanYi Micro Hei Mono`, `文泉驿等宽正黑`, `WenQuanYi Zen Hei Mono`      | `黑体`, `SimHei`, `新宋体`, `NSimSun`                  |
| `zh-Hant` | -                 | `文泉驛等寬微米黑`, `WenQuanYi Micro Hei Mono`, `文泉驛等寬正黑`, `WenQuanYi Zen Hei Mono`      | `細明體`, `MingLiU`                                    |

</details>

<details>
<summary><code>sans-serif-display</code> (<code>en</code> only, for headings)</summary>

- Preferred: `Inter Display`, `InterDisplay`, `InterVariable`
- Apple: `SF Pro Display`, `SF Display`, `San Francisco Display`, `SF Pro`
- Chromium / Android / Linux: `Google Sans Flex`, `Roboto Flex`
- Windows: `Segoe UI Variable Display`

</details>

<details>
<summary><code>emoji</code> (language-agnostic)</summary>

- Apple: `Apple Color Emoji`
- Android / Linux: `Noto Color Emoji`
- Windows: `Segoe UI Emoji`, `Segoe UI Symbol`

</details>

---

### 4.12 Tooltips

**Brief**: Initializes Bootstrap tooltips with proper ARIA attributes. Provides reusable utility functions for single-element tooltip creation and disposal.

**Related Files**:

| File                            | Role                                                                                                                               |
|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `scripts/functions/tooltips.js` | Tooltip lifecycle: `initAllTooltips()`, `disposeAllTooltips()`, `createTooltip()`, `disposeTooltip()`, `initAllCopyLinkTooltips()` |

**Key Functions**:

- `initAllTooltips()` - scans all `[data-bs-toggle="tooltip"]` elements and creates tooltip instances via `createTooltip()`.
- `disposeAllTooltips()` - disposes all tooltip instances on the page via `disposeTooltip()`. Called before page transitions to prevent orphaned tooltips.
- `createTooltip(element)` - creates a Bootstrap Tooltip on a single element. Idempotent: disposes any existing tooltip on the element first.
- `disposeTooltip(element)` - disposes a Bootstrap Tooltip from a single element, if one exists.
- `initAllCopyLinkTooltips()` - batch function: sets up copy-link tooltips on all `.copy-link` elements via `initCopyLinkTooltip()`.
- `initCopyLinkTooltip(link)` - sets tooltip attributes and attaches the named `handleCopyLinkClick` handler to a single `.copy-link` element.
- `disposeCopyLinkTooltip(link)` - removes the click handler, tooltip attributes, and disposes the Bootstrap Tooltip instance from a single `.copy-link` element.

---

### 4.13 Image Utilities

**Brief**: Provides a unified `data-img-feature` attribute system for image behaviors such as theme-following source swapping, CSS mask-based monochrome coloring, and loading-state opacity control.

**Related Files**:

| File                               | Role                                                                                 |
|------------------------------------|--------------------------------------------------------------------------------------|
| `scripts/functions/img-utils.js`   | Initializes `data-img-feature="colored"` images and image loading opacity            |
| `stylesheets/modern/img-utils.css` | CSS rules for `[data-img-feature~="colored"]` mask-based styling and loading opacity |
| `scripts/functions/theme.js`       | `applyAllThemeBasedImages()` handles `data-img-feature~="follow-theme"` images       |
| `images/null.png`                  | Placeholder image used with `data-img-feature="colored"`                             |
| `images/README.md`                 | Copyright notice for image assets                                                    |

#### 4.13.1 `data-img-feature` Attribute

The `data-img-feature` attribute on `<img>` elements declares which image features apply. Multiple features are space-separated (e.g. `data-img-feature="follow-theme colored"`).

#### 4.13.2 `follow-theme`

Swaps `src` between light and dark variants based on the current theme.

- `data-img-feature="follow-theme"` — enables theme-based source swapping
- `data-src-light` — URL for the light-theme image (populated automatically if missing)
- `data-src-dark` — URL for the dark-theme image

Handled by `applyAllThemeBasedImages()` in `theme.js` (see [§4.4 Theme System](#44-theme-system)).

#### 4.13.3 `colored`

Renders monochrome icons via CSS `mask-image`, colored by a CSS custom property.

- `data-img-feature="colored"` — enables mask-based coloring
- `data-src-mask` — path to the mask source image (e.g. `/images/icons/email.webp`)
- `data-color-var` — CSS variable name (without `--` prefix) for the fill color (e.g. `bs-body-color`, `shlh-primary-color`)

Handled by `initAllColoredImages()` in `img-utils.js`, which sets `--img-mask-url` and `--img-color` CSS custom properties on each element. The generic CSS in `img-utils.css` applies `background-color` and `mask` based on these properties.

#### 4.13.4 `loading-opacity`

Renders `<img>` elements semi-transparent (`opacity: 0.5`) while their source is loading, then fades to fully opaque (`opacity: 1`) once the image has loaded. Colored images (`data-img-feature~="colored"`) are excluded because their visual comes from CSS `mask` / `background-color` rather than the `src`.

- **Default state**: All `<img>` elements are `opacity: 0.5` with `transition: opacity .2s ease`.
- **Loaded state**: When an image finishes loading (or is already cached), the `data-img-loaded` attribute is added, which sets `opacity: 1`.
- **Error state**: Images that fail to load are also marked as loaded to prevent them from staying semi-transparent forever.

**Key Functions** (in `img-utils.js`):

| Function                       | Role                                                                           |
|--------------------------------|--------------------------------------------------------------------------------|
| `markImageLoaded(img)`         | Adds `data-img-loaded` attribute → `opacity: 1`                               |
| `markImageUnloaded(img)`       | Removes `data-img-loaded` attribute → `opacity: 0.5`                          |
| `initImageLoadingOpacity(img)` | Checks if image is cached (mark immediately) or binds `load`/`error` listeners |
| `initAllImageLoadingOpacity()` | Batch function: calls `initImageLoadingOpacity()` on every `<img>`             |

**CSS Rules** (in `img-utils.css`):

```css
img {
    opacity: 0.5;
    transition: opacity .2s ease;
}

img[data-img-loaded],
img[data-img-feature~="colored"] {
    opacity: 1;
}
```

**Interaction with Theme System** ([§4.4](#44-theme-system)):

When `applyThemeBasedImage()` switches the `src` of a `follow-theme` image during theme changes, it calls `markImageUnloaded(img)` before changing `src` and `initImageLoadingOpacity(img)` afterward. This prevents the old theme's image from briefly remaining visible at full opacity while the new theme's image loads.

### 4.14 SVG Injection

**Brief**: Replaces `<span>` placeholders with inline SVG fetched from files at runtime, avoiding hardcoded SVG markup in HTML. Supports dynamic dimension and color control via data attributes.

**Related Files**:

| File                             | Role                                                                |
|----------------------------------|---------------------------------------------------------------------|
| `scripts/functions/svg-utils.js` | `initSvgInjection()` — fetches SVG files and injects as inline DOM |
| `images/svg/`                    | SVG source files (e.g. `steve-hsu.svg`)                             |

**How It Works**:

```
HTML: <span data-role="svg" data-src="/images/svg/steve-hsu.svg" data-width="32" data-height="28" data-color-var="bs-link-color"></span>
        ↓ (svg-utils.js at init time)
      Fetch /images/svg/steve-hsu.svg → replace fill="currentColor" with var(--bs-link-color)
        ↓
      Set width/height on <svg>, inject as innerHTML
```

**Attributes**:

| Attribute         | Role                                                    | Example                  |
|-------------------|---------------------------------------------------------|--------------------------|
| `data-role="svg"` | Declares this element as an SVG placeholder             | -                        |
| `data-src`        | Path to the SVG file                                    | `/images/svg/logo.svg`   |
| `data-width`      | SVG width (default unit: px)                            | `32`                     |
| `data-height`     | SVG height (default unit: px)                           | `28`                     |
| `data-color-var`  | CSS variable name (without `--`) for `fill` replacement | `bs-link-color`          |

**SVG File Convention**:

- Use `fill="currentColor"` as a placeholder in the SVG file; it will be replaced at injection time.
- Do not hardcode `width`/`height` in the SVG file; they are set via `data-width`/`data-height`.
- Always include a `viewBox` attribute for proper scaling.

---

### 4.15 Utilities

**Brief**: General-purpose helper functions used across the project.

**Related Files**:

| File                              | Role                                                                      |
|-----------------------------------|---------------------------------------------------------------------------|
| `scripts/functions/utils.js`      | Shared utility functions (path normalization, page name extraction, etc.) |
| `scripts/functions/page-title.js` | Page title management                                                     |

---

### 4.16 SEO

**Brief**: Search engine optimization via meta tags, structured data (JSON-LD), sitemap, hreflang, Open Graph, Twitter Cards, and PWA manifest. Applied across all full-functionality pages and the 404 page.

**Related Files**:

| File            | Role                                                                   |
|-----------------|------------------------------------------------------------------------|
| `sitemap.xml`   | XML sitemap listing all indexable pages with hreflang                  |
| `manifest.json` | PWA web app manifest for mobile install experience                     |
| `robots.txt`    | Crawler directives; blocks AI bots from `/images/`; references sitemap |

#### 4.16.1 SEO Elements by Page Tier

| Element                   | Full-Functionality Pages                        | 404 (Lightweight)  | Error Pages (Minimal) |
|---------------------------|-------------------------------------------------|--------------------|-----------------------|
| `meta description`        | ✓ Unique per page                              | ✓                 | ✓                    |
| `meta author`             | ✓                                              | ✓                 | ✓                    |
| `meta robots`             | ✓ `index, follow`                              | ✓ `noindex`       | ✓ `noindex`          |
| `link canonical`          | ✓                                              | ✓                 | ✓                    |
| `<title>`                 | ✓ `{Page} - Steve Hsu (什五)'s Link-Hub`       | ✓                 | ✓                    |
| `link favicon`            | ✓                                              | ✓                 | ✓                    |
| `link manifest`           | ✓                                              | ✗                 | ✗                    |
| Apple PWA meta tags       | ✓ `apple-mobile-web-app-capable` + others      | ✓                 | ✓                    |
| `link sitemap`            | ✓                                              | ✗                 | ✗                    |
| Hreflang `<link>`s        | ✓ en, zh-Hans, zh-Hant, x-default              | ✓                 | ✗                    |
| Open Graph tags           | ✓                                              | ✓                 | ✓                    |
| `og:locale:alternate`     | ✓ zh_Hans_CN, zh_Hant_TW                       | ✓                 | ✗                    |
| Twitter/X Card tags       | ✓ `summary_large_image`                        | ✓                 | ✓                    |
| Multiple `theme-color`    | ✓                                              | ✓                 | ✗                    |
| JSON-LD (inline)          | ✓ See [§4.16.2](#4162-structured-data-json-ld) | ✗                 | ✗                    |
| `<noscript>` SEO fallback | ✓ In `<body>`, core text + key links           | ✗                 | ✗                    |

**Error pages do not need SEO optimization** beyond basic `description`, `canonical`, `robots: noindex`, and existing OG/Twitter tags. They must not appear in the sitemap.

#### 4.16.2 Structured Data (JSON-LD)

All JSON-LD scripts are **inline** (not external `src`) for maximum search engine compatibility. Use `\uXXXX` escape sequences for special Unicode characters within JSON strings.

##### 4.16.2.1 Homepage (`index.html`)

- **`Person`** schema with `sameAs` (all social platform URLs), `email`, `image`, `knowsLanguage`, `gender`.
- **`WebSite`** schema with `SearchAction` and `inLanguage`.
- The `sameAs` array must include every verified social/creative platform profile URL. When adding a new platform link, update this list.

##### 4.16.2.2 Sub-Pages

- **`BreadcrumbList`** schema only: `Home → {Current Page Name}`.
- Duplicate `Person` or `WebSite` across sub-pages is unnecessary; the homepage already declares them.

#### 4.16.3 Sitemap

- All 6 full-functionality pages are listed in `sitemap.xml`.
- Each `<url>` includes `xhtml:link` hreflang alternates for `en`, `zh-Hans`, `zh-Hant`, and `x-default`.
- `lastmod`, `changefreq`, and `priority` are set per page.
- Error pages and 404 must NOT be included.
- `robots.txt` references the sitemap via `Sitemap: https://stevehsudrawing.github.io/sitemap.xml`.

#### 4.16.4 Hreflang

- Language variants are distinguished via the `?lang=` query parameter on each page URL:
    - `?lang=en` — English
    - `?lang=zh-Hans` — Simplified Chinese
    - `?lang=zh-Hant` — Traditional Chinese
- The `x-default` hreflang points to the parameter-less URL, signaling that the page does not specifically target any one language and will auto-detect based on saved preference.
- Language detection priority: `?lang=` query parameter → `localStorage` (`preferredLang`) → default `'en'`.
- When the user switches language via the UI, `history.replaceState()` updates the URL with the new `?lang=` parameter without creating a browser history entry.
- The Page Transition System ([§4.6](#46-page-transitions)) preserves the `?lang=` parameter across internal SPA navigations, so the user's chosen language persists through page transitions.
- Hreflang `<link>` tags in `<head>` use the `?lang=` URLs to give each language a unique URL for search engines.
- Language code normalization: a `normalizeLang()` function (in `scripts/functions/i18n.js`) maps common regional variants to the site's three supported codes. This is called at the entry of `loadLang()`, ensuring all language inputs (URL parameters, localStorage values, UI selections) are canonicalized before translation files are loaded:
    - `zh-HK`, `zh-MO`, `zh-TW`, `zh-Hant`, `zh-Hant-*` → `zh-Hant`
    - `zh-CN`, `zh-SG`, `zh`, `zh-Hans`, `zh-Hans-*` → `zh-Hans`
    - Other `zh-*` variants → `zh-Hans` (fallback)
    - `en`, `en-*`, any unrecognized code → `en` (default)
- Hreflang tags only declare these three canonical codes; regional variants are not listed to avoid false duplicate-content signals.

#### 4.16.5 Noscript SEO Fallback

- Each full-functionality page includes a `<noscript>` block at the top of `<body>`.
- Contains the page title (`<h2 class="pseudo-h1">`) and a descriptive paragraph (`<p>`). The `<h2>` avoids conflicting with the page's sole `<h1>` (see [§4.16.6](#4166-heading-hierarchy)).
- The homepage noscript additionally includes a `<ul>` of key platform links.
- This is purely for search engine crawlers; users without JS are redirected by the `<head>` noscript before seeing this content.

#### 4.16.6 Heading Hierarchy

- **Every page must have exactly one `<h1>`**. This is the primary SEO heading signal. Multiple `<h1>`s dilute ranking and are flagged as critical issues by SEO tools.
- The `<h1>` must be **pure text** — no `<a>` links, no inline markup beyond semantic phrasing elements. Links dilute the heading keyword signal.
- **Sub-section headings** (e.g. \"My Softwares\", \"Blogs & Sponsor\") use `<h2 class="pseudo-h1">`. The `.pseudo-h1` class (defined in `stylesheets/modern/base.css`) applies the same font size as `<h1>` while preserving correct heading hierarchy for SEO and accessibility.
- **`<noscript>` fallback headings** use `<h2 class="pseudo-h1">` to avoid creating a second `<h1>` that search engines would count against the page.

#### 4.16.7 Homepage H1 Rich Text

- The homepage `<h1>` uses `data-i18n-html="text-steve-hsu-s-link-hub-rich"` with inline HTML markup.
- The translation string includes `<span class="color-primary">` to brand the name with the site's primary color (defined in `stylesheets/modern/theme.css`).
- This approach allows per-language flexibility: the name can appear at the beginning, middle, or end of the title depending on the language's grammar.
- The English fallback text between the tags serves as both the default rendering and the English translation.

#### 4.16.8 Crawler Whitelist

- `scripts/env-detections/browser.js` must whitelist known search engine bots and SEO crawlers via the `isBotOrCrawler()` function.
- Without this whitelist, crawlers with User-Agents that do not match recognized browser patterns are detected as \"unsupported\" and redirected to `error-unsupported-browser.html`, which has `robots: noindex`. This prevents the site from being indexed.
- The whitelist covers:
    - **Search engines**: Googlebot, Bingbot, Baiduspider, Yandex, DuckDuckGo, Yahoo Slurp, Sogou, 360Spider
    - **Social media**: Facebook, Twitter/X, LinkedIn, Discord
    - **SEO tools**: Ahrefs, SEMrush, Moz, Majestic, Sitebulb, Seobility, Screaming Frog
    - **AI crawlers**: GPTBot (OpenAI), ClaudeBot (Anthropic), PerplexityBot, DeepSeekBot
    - **Generic fallback**: any UA containing `bot`, `crawler`, `spider`, or `scraper` is also allowed
- `isBotOrCrawler()` is called at the top of `isBrowserSupported()`; if it returns `true`, the browser is treated as supported regardless of version detection.

---

### 4.17 External Link Confirmation

**Brief**: Intercepts clicks on external links (`.external-link`) and shows a confirmation modal before navigating away from the site. Allows the user to choose whether to open the link in a new tab.

**Related Files**:

| File                                              | Role                                               |
|---------------------------------------------------|----------------------------------------------------|
| `scripts/functions/external-link-confirmation.js` | Link interception, modal display, navigation logic |
| `stylesheets/external-link-confirmation.css`      | Modal URL display styling                          |
| `page-components/modals.html`                     | Confirmation modal HTML (shared with other modals) |

**How It Works**:

```
User clicks a.external-link
  ↓ (preventDefault)
shouldConfirmExternalLink(link) checks:
  - Must have .external-link class
  - Must have a valid href (not #, javascript:, mailto:, tel:)
  - Must not have download or onclick attributes
  - Must not be an internal page (isInternalPage check)
  ↓ Passes all checks
Show confirmation modal:
  - Displays the target URL
  - "Open in new tab" toggle (synced with localStorage openExternalLinksInNewTab)
  - [Open] button -> navigateToExternalUrl()
  - [Close] button / x / backdrop -> dismiss
  ↓ User clicks [Open]
navigateToExternalUrl():
  - If toggle is ON -> window.open(url, '_blank', 'noopener,noreferrer')
  - If toggle is OFF -> window.location.href = url
```

- Modifier key clicks (Ctrl/Cmd/Shift/Alt) bypass the confirmation and let the browser handle the link normally.
- The "Open in new tab" toggle shares the same `localStorage` key (`openExternalLinksInNewTab`) with the settings modal ([§4.8](#48-settings--preferences)). Changes in either location are immediately reflected in the other.

**Key Functions**:

- `shouldConfirmExternalLink(link)` - Determines whether a clicked link should trigger the confirmation modal.
- `showExternalLinkConfirmation(url)` - Populates and displays the confirmation modal for the given URL.
- `navigateToExternalUrl(url)` - Performs the actual navigation based on the toggle state.
- `handleExternalLinkClick(e)` - Delegated click handler that intercepts `.external-link` clicks.
- `handleExternalLinkConfirm()` - Handles the [Open] button click.
- `handleExternalLinkToggleChange()` - Persists toggle changes to localStorage and applies the target behavior.
- `initExternalLinkConfirmation()` - Sets up delegated event listeners on `document`. Called once from `init-final.js`.

**Data Flow**:

| Mechanism      | Key                         | Purpose                                                       |
|----------------|-----------------------------|---------------------------------------------------------------|
| `localStorage` | `openExternalLinksInNewTab` | Shared preference with settings modal ([§4.8](#48-settings--preferences)) for new-tab toggle |

**Interaction with Other Systems**:

- **Page Transition ([§4.6](#46-page-transitions))**: The confirmation system only intercepts `.external-link` links. Internal links continue to be handled by `page-transition.js` via `shouldInterceptLink()`.
- **Settings ([§4.8](#48-settings--preferences))**: The new-tab toggle in the confirmation modal and the one in the settings modal share the same `localStorage` key. The `isExternalLinkNewTabEnabled()` / `setExternalLinkNewTabPreference()` / `applyAllExternalLinkTargetBehavior()` functions from `settings.js` are called by the confirmation module.
- **Utilities ([§4.15](#415-utilities))**: `isInternalPage()` (in `utils.js`) is used to avoid showing the confirmation for links that point to internal pages.
- **Component Loading ([§4.2](#42-component-loading))**: The modal HTML is part of `modals.html`, loaded by the component loader during initial page load.

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
3. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `→`.
4. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
5. **Conventions of Commit Messages**:
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
