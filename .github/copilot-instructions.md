# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

---

## 1. Tech Stack

### Base Language

- **HTML** 5
- **CSS**
- **JavaScript**: Vanilla JS

### External Dependencies (CDN)

Loaded in `<head>` of each page:

| Resource          | Type | Role             | URL                                                                            | Version  |
|-------------------|------|------------------|--------------------------------------------------------------------------------|----------|
| Bootstrap CSS     | CSS  | Framework        | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css`      | 5.3.8    |
| Bootstrap Icons   | CSS  | Icon Library     | `https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css`        | (latest) |
| Inter Font Family | CSS  | Font Family      | `https://rsms.me/inter/inter.css`                                              | (latest) |
| QRCode.js         | JS   | QR Code Utility  | `https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js`                    | 1.0.0    |
| html-to-image     | JS   | HTML → Image    | `https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.min.js` | 1.11.13  |

Loaded at the end of `<body>` of each page:

| Resource     | Type | Role               | URL                                                                            | Version |
|--------------|------|--------------------|--------------------------------------------------------------------------------|---------|
| Popper.js    | JS   | Positioning Engine | `https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js`    | 2.11.8  |
| Bootstrap JS | JS   | Framework          | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js` | 5.3.8   |

### Deployment

- **Platform**: GitHub Pages
- **Build step**: None: raw HTML/CSS/JS served directly from the repository root.

## 2. Naming Conventions

### HTML / CSS

| Category          | Convention / Constraint     | Examples                                                   |
|-------------------|-----------------------------|------------------------------------------------------------|
| Element IDs       | `dash-case`                 | `#page-content`, `#skip-button`, `#language-select`        |
| CSS classes       | `dash-case`                 | `.loading-screen`, `.link-button-group`, `.img-mono-pixiv` |
| Custom attributes | `data-*` with `dash-case`   | `data-bs-theme`, `data-i18n`, `data-i18n-tooltip`          |
| Bootstrap classes | Use Bootstrap-native naming |  `btn-primary`, `dropdown-menu`, etc.                      |

### CSS Custom Properties

- **Project-specific**: prefix `--shlh-*` (short for **S**teve **H**su's **L**ink-**H**ub)
    - **Color**: The naming convention is similar to Bootstrap (e.g. `--shlh-primary`, `--shlh-primary-rgb`), but an additional parameter has been added to indicate color brightness, which the range is 100-900 (from bright to dark) (e.g. `--shlh-primary-500`, `--shlh-primary-500-rgb`).
    - **Font Settings**: `--shlh-font-` + type + priority + language code \
        e.g. `--shlh-font-sans-serif-major-en`, `--shlh-font-monospace-fallback-ja`
- **Bootstrap (overrides)**: prefix `--bs-*` \
    e.g. `--bs-link-hover-color`

### JavaScript

| Category              | Convention             | Examples                                    |
|-----------------------|------------------------|---------------------------------------------|
| Variables             | `camelCase`            | `currentLang`, `supportedLangs`, `langData` |
| Functions             | `camelCase`            | `loadAllComponents`, `updatePageText`       |
| Constants (top-level) | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES`, `EXCLUDED_PAGES`          |
| DOM element refs      | `camelCase`            | `htmlElement`, `prefersColorScheme`         |

#### Function Naming by Category

| Prefix       | Purpose                        | Examples                                                                                     |
|--------------|--------------------------------|----------------------------------------------------------------------------------------------|
| `init*`      | Initialize / set up listeners  | `initThemePreference`, `initSkipButton`, `initTooltips`, `initScrollHint`, `initPageContent` |
| `load*`      | Async data fetching            | `loadSupportedLangs`, `loadLang`, `loadAllComponents`, `loadHTML`                            |
| `update*`    | Update existing DOM content    | `updatePageText`, `updatePageTitle`, `updateThemeToggleText`                                 |
| `apply*`     | Apply a setting / style change | `applyThemePreference`, `applyThemeBasedImages`, `applyExternalLinkTargetBehavior`           |
| `get*`       | Retrieve / compute a value     | `getSystemTheme`                                                                             |
| `set*`       | Set a state / attribute        | `setActiveNavItem`, `setActiveLangItem`, `setActiveThemeItem`                                |
| `populate*`  | Fill UI lists / menus          | `populateLanguageMenus`                                                                      |
| `generate*`  | Create and inject DOM elements | `generateLinkCards`                                                                          |
| `hide*`      | Hide an element                | `hideLoadingScreen`                                                                          |
| `extract*`   | Parse / derive from input      | `extractPageName`                                                                            |
| `normalize*` | Normalize / sanitize input     | `normalizeInternalPath`                                                                      |

> Prefer existing prefixes when adding new functions. If none fit, use a clear descriptive verb.

## 3. Project Structure

```
/
├── .github/                      # GitHub-specific configs
│   └── copilot-instructions.md   # This file
├── configs/
│   ├── language-list.json        # Supported languages list
│   ├── i18n/                     # Translation JSON files
│   └── links/                    # Link-card data JSON files
├── images/
│   ├── covers/                   # Cover images
│   ├── icons/                    # Icon images
│   ├── stickers/                 # Sticker images
│   └── README.md                 # Copyright Notice
├── scripts/
│   ├── detections/               # Browser/environment detection
│   ├── functions/                # Reusable function modules (DEFINE ONLY)
│   ├── init-at-head.js           # Runs in <head>
│   ├── init-final.js             # Main init (full page, all features)
│   └── init-final-lightweight.js # Lightweight init (except Page Transition System)
├── stylesheets/
│   ├── base.css                  # Reset, layout, typography
│   ├── color-scheme.css          # Light/dark theme CSS custom properties
│   ├── components.css            # Component styles, organized by comment headers
│   ├── fonts.css                 # Font face declarations
│   └── mono-img.css              # Monochrome image/icon utilities
├── sub-pages/                    # HTML fragments loaded at runtime
│   ├── header.html
│   ├── footer.html
│   ├── footer-lightweight.html
│   └── modals.html
├── index.html                    # Homepage
├── about.html
├── artworks-and-videos.html
├── blogs-and-sponsor.html
├── chatting.html
├── softwares.html
├── 404.html                      # Page specially designed for HTTP 404
├── unsupported.html              # Designed for unsupported browsers
├── robots.txt
└── README.md
```

## 4. Structural Constraints

### `*.html`: Page Functionality

- **Full functionality**: `index`, `about`, `artworks-and-videos`, `blogs-and-sponsor`, `chatting`, `softwares`
- **`404`**: The redirected page when an HTTP 404 occurs. It uses the lightweight init.
- **`unsupported`**: Specifically designed for unsupported browsers, without relying on external CDNs. The page layout should be written as closely as possible to Bootstrap 5.3, but it can also be appropriately simplified.

### `scripts/functions/`: Define Only, Never Execute

- Files in `scripts/functions/` must **only define variables and functions**.
- Every function **must have JSDoc** written for it.
- They must **NOT** contain top-level function calls or self-executing code.
- A function defined here should never call itself at the top level of the file.
- All execution / wiring happens in the `init-*.js` entry points.

```js
// In scripts/functions/example.js:

// CORRECT:
/**
 * This function will do something.
 */
function doSomething() { /* ... */ }

// WRONG:
doSomething();  // No top-level execution!
document.addEventListener('DOMContentLoaded', doSomething);  // No!
```

### `scripts/init-*.js`: Entry Points, Wire Everything

- These files import functions from `scripts/functions/` and call them in the correct order.
- `init-at-head.js`: Runs synchronously in `<head>`.
- `init-final.js`: Full initialization on `DOMContentLoaded`. Loads components, i18n, settings, page transitions, etc.
- `init-final-lightweight.js`: Cut-down version. The initialization script of this version does not load the Page Transition System.

### `stylesheets/`: Organize by Comment Headers

- Group style rules by the component or purpose they serve.
- Use large comment blocks as section dividers:
- Reference the related JS function/file in the header comment for traceability.

```css
/* ========================================================================
   Component Name - description (related-script.js (if exist))
   ======================================================================== */

/* --- Child description --- */

.selector {
    /* ... */
}
```

### `sub-pages/`: HTML Fragments

- Contain reusable HTML snippets loaded via `component-loader.js`.
- Elements with `data-component` attribute in the main page are placeholders that get replaced.
- The component loader maps element `id` → `/sub-pages/{id}.html`.

### `configs/links/`: Link Card Data

- JSON files defining link-card structures for each page.
- These JSON files define the list of **Link Card Groups** (see below).
- Rendered by `link-cards-generator.js`.

#### JSON Structural Standards

- **The format of representing HTML elements using JSON**:
    - `content`: Represents the content of an HTML element.
    - `properties`: Represents the attributes contained in an HTML element.
        - `classes` is a special value that specifies the list of classes for this element.

    For example, here is a `<span>` element:
    ```json
    {
        "content": "My personal email",
        "properties": {
            "data-i18n": "text-email-title-2"
        }
    }
    ```

    It should be converted into the following HTML elements:
    ```html
    <span data-i18n="text-email-title-2">My personal email</span>
    ```

    Here is a `<img>` element:
    ```json
    {
        "properties": {
            "alt": "Email",
            "src": "/images/null.png",
            "classes": [
                "img-mono-email",
                "img-mono-fill-body-color"
            ]
        }
    }
    ```

    It should be converted into the following HTML elements:
    ```html
    <img alt="Email" src="/images/null.png" class="img-mono-email img-mono-fill-body-color">
    ```

- **Super-Link / Text Fragment**:
    - `superLink`: Indicates whether it is a "super-link" as a Boolean value.
        - When the value is `true`, treat it as an `<a>` element and place the `<span>` elements listed in `text` inside it. `properties` are usually also attached. Note: All super-links defined here will be considered external links (with `link` and `external-link` classes added).
        - When the value is `false`, only `text` is used, which means that only the `<span>` elements listed in `text` need to be inserted, without the need for element nesting.
    - `text`: A list of `<span>` element descriptors, each with `content` and optional `properties`.
    - `properties`: Represents the attributes contained in this `<a>` element (if exists).

    e.g.
    ```json
    {
        "superLink": true,
        "text": [
            {
                "content": "My personal email",
                "properties": {
                    "data-i18n": "text-email-title-2"
                }
            }
        ],
        "properties": {
            "href": "mailto:stevehsudrawing@outlook.com"
        }
    }
    ```

- **Link Card**:
    - `available` A boolean value that specifies whether this Link Card is in an "available" state.
        - When the value isn't `true`, add a `opacity-75` class to it.
    - `icon`: Specifies the attributes of the icon (`<img>`) element.
    - `title`: A list of Text Fragments, showing how the title is composed.
    - `description`: A list of Text Fragments, showing how the description is composed.

    e.g.
    ```json
    {
        "available": true,
        "icon": {
            "properties": {
                "alt": "Pixiv",
                "src": "/images/icons/pixiv.png"
            }
        },
        "title": [
            {
                "superLink": true,
                "text": [
                    { "content": "Pixiv" }
                ],
                "properties": {
                    "href": "https://www.pixiv.net/users/70732361"
                }
            }
        ],
        "description": [
            {
                "superLink": false,
                "text": [
                    { "content": "UID: 70732361" }
                ]
            }
        ]
    }
    ```

- **Link Card Group**:
    - `title`: A list of `<span>` element descriptors that compose the group title (`<h4>`), each with `content` and optional `properties`.
    - `description`: A list of Text Fragments, showing how the description is composed. This is optional.
    - `contents`: A list of Link Cards, showing how the group is composed.

    e.g.
    ```json
    {
        "title": [
            {
                "content": "Artworks",
                "properties": {
                    "data-i18n": "text-artworks"
                }
            }
        ],
        "contents": [
            {
                "available": true,
                "icon": {
                    "properties": {
                        "alt": "Pixiv",
                        "src": "/images/icons/pixiv.png"
                    }
                },
                "title": [
                    {
                        "superLink": true,
                        "text": [
                            { "content": "Pixiv" }
                        ],
                        "properties": {
                            "href": "https://www.pixiv.net/users/70732361"
                        }
                    }
                ],
                "description": [
                    {
                        "superLink": false,
                        "text": [
                            { "content": "UID: 70732361" }
                        ]
                    }
                ]
            }
        ]
    }
    ```

## 5. Architecture Patterns

### Component Loading

```
HTML: <div id="header" data-component></div>
        ↓ (component-loader.js at init time)
      Fetches /sub-pages/header.html → injects innerHTML
```

### Internationalization (i18n)

```
HTML: <span data-i18n="text-welcome">Welcome</span>
        ↓ (i18n.js loads configs/i18n/{lang}.json)
      Replaces textContent with translated value

Tooltips: <a data-bs-toggle="tooltip" data-i18n-tooltip="text-foo" data-bs-title="Foo">
        ↓ (updatePageText() rewrites data-bs-title from langData)
```

- Language preference persisted in `localStorage` key: `preferredLang`.
- Supported languages defined in `configs/language-list.json`.
- All user-facing strings should have corresponding entries in all these JSON files.

### Theme System

- This preference persisted in `localStorage` key: `bsTheme`.
- Uses Bootstrap's `data-bs-theme` attribute on `<html>`.
- Three modes: `auto` (follow OS), `light`, `dark`.
- Custom CSS variables prefixed `--shlh-` define brand colors per theme.
- System theme changes listened via `matchMedia('(prefers-color-scheme: dark)')`.

### Preference of "Always open external links in a new tab"

- This preference persisted in `localStorage` key: `openExternalLinksInNewTab`.
- Controlled by a toggle (`#external-links-new-tab-toggle`) in the settings modal.
- **Default**: enabled - the preference is considered on unless explicitly set to `'false'`.
- Managed by `settings.js` via three functions:
    - `isExternalLinkNewTabEnabled()` - reads the preference from localStorage.
    - `setExternalLinkNewTabPreference(enabled)` - persists the preference.
    - `applyExternalLinkTargetBehavior()` - applies `target="_blank` and `rel="noopener noreferrer` to all `a.external-link` elements, or removes them when disabled.
- The toggle change event is handled by `initSettingEventListeners()`.
- When the settings modal is first opened, `initSettingsModal()` syncs the toggle state with the stored preference.

### Page Transitions

- Internal links (`class="internal-link`) trigger SPA-style transitions.
- A progress bar (`#page-transition-progress`) animates at the top of the viewport.
- Content is dimmed during transition.
- Managed by `page-transition.js`.

### Loading Screen

- `#loading-screen` overlay shown on page load.
- Hidden by `hideLoadingScreen()` after all initialization completes.
- Custom event `pageInitialized` signals that deferred listeners can run.

## 6. Data Flow

| Mechanism      | Key / Event                 | Purpose                                                                 |
|----------------|-----------------------------|-------------------------------------------------------------------------|
| `localStorage` | `bsTheme`                   | Persist theme preference                                                |
| `localStorage` | `preferredLang`             | Persist language preference                                             |
| `localStorage` | `openExternalLinksInNewTab` | Persist the preference of "Always open external links in a new tab"     |
| CustomEvent    | `pageInitialized`           | Signal that all init scripts have finished; deferred listeners use this |
| URL hash       | `#section-id`               | Scroll to anchor after page load (via `initHashChangeScroll()`)         |
| Global vars    | `currentThemePreference`    | Current theme choice (`'auto'`, `'light'`, `'dark'`)                    |
| Global vars    | `currentLang`               | Currently loaded language code                                          |
| Global vars    | `langData`                  | Loaded translation key-value pairs                                      |
| Global vars    | `supportedLangs`            | Array of available language codes                                       |

## 7. Accessibility

- **Skip button** (`#skip-button`): Allows keyboard users to skip navigation. Managed by `accessibility.js`.
- **Focus management**: CSS distinguishes keyboard focus (`.user-input-keyboard #skip-button:focus`) from mouse focus (`:focus-visible`).
- **Tooltips**: Bootstrap tooltips are initialized with proper ARIA attributes via `initTooltips()`.
- **Language**: `lang` attribute on `<html>` should reflect the current language.

## 8. Miscellaneous Notes

- **`scripts/detections/browser.js`**: This script is executed first, and it's written in ES5 for compatibility. If an unsupported browser is detected, it redirects to `unsupported.html`.
- **Custom image CSS**: `mono-img.css` provides utility classes for colorizing monochrome icon images to match Bootstrap's primary color or body text color.
- **`images/null.png`**: This is a placeholder image, intended for use with `img-mono-fill-*`.
- **QR Code**: Generated dynamically via QRCode.js inside a branded share card (logo + site name). Can be downloaded as a PNG image via html-to-image.
- **`.gitignore`**: This file explains that some files do not need to be uploaded to the repository, such as `*.cmd` files used for local debugging.

## 9. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: internal reasoning and analysis should be in English.
2. **Respond using the language that the user is using**: for example, if the user is conversing in Chinese, responses should be in Chinese.
3. **Write code / docs / commit messages in English (United States)**: all code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like using `-` instead of `—`.
4. **Discuss before executing**: when the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
5. **Conventions of Commit Messages**:
    - The whole commit message should be as short as possible.
    - List 1-4 major changes, small changes can be ignored.
    - Basic example format:
    ```
    Summary
    - Major Change 1
    - Major Change 2
    - Major Change 3
    ```