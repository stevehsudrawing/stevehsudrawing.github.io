---
description: >
  General file rules: src/{core,ui,features} define only (no top-level execution),
  main.ts wire everything, CSS commenting conventions, HTML page tiers (full/error
  with minimal external reference), Markdown document writing standards (numbered
  headings, section cross-references).
  Use when: adding new modules, entry points, CSS, HTML pages, or markdown docs.
applyTo: >
  src/**/*.ts;
  src/stylesheets/**;
  public/legacy/*.css;
  *.html;
  *.md
---

### 3.2 General File Rules

#### 3.2.1 `src/{core,ui,features}/*`: Define Only, Never Execute

- Files in `src/{core,ui,features}/*` must **only define variables and functions**, using **TypeScript** syntax targeting ES2020. `var` should be avoided.
- Every exported variable and function **must have JSDoc** written for it.
- They must **NOT** contain top-level function calls or self-executing code.
- A function defined here should never call itself at the top level of the file.
- All execution / wiring happens in the `main.ts` entry point (see [§3.2.2](#322-srcmaints-entry-point-wires-everything)).
- **Exception**: `public/legacy/env-detection.js` is a classic script (not a module) that runs before `<head>` to perform browser/crawler detection. It DOES execute at the top level, but must still use **ES5** syntax for broad compatibility.
- **Exception**: `src/ui/theme.ts` evaluates `document.documentElement` and `window.matchMedia(...)` at the top level. This is necessary to apply the theme before the first paint and avoid a flash of incorrect theme. Other modules must not follow this pattern.

```ts
// In src/core/example.ts:

// CORRECT:

/** @type {number} This is an exported constant. */
export const EXAMPLE_NUMBER = 1;

/**
 * This function will do something.
 * @returns {void}
 */
export function doSomething() {
  /* ... */
}

// WRONG:
doSomething(); // No top-level execution!
document.addEventListener("DOMContentLoaded", doSomething); // No!
```

#### 3.2.2 `src/main.ts`: Entry Point, Wires Everything

- `main.ts`: Full-feature entry point. Imports all CSS, npm dependencies, and project modules. Performs early theme initialization (before first paint). Loads all components, i18n, settings, page transitions, QR code, link cards, etc. on `DOMContentLoaded` (via Vue `createApp` + `App.vue` `onMounted`).
- `public/legacy/env-detection.js`: Perform basic browser/environment detection before starting to load the page. Runs before `<head>`. (Kept as plain JS for ES5 compatibility.)

#### 3.2.3 `src/stylesheets/` & `public/legacy/*.css`: Commenting Convention

- **`src/stylesheets/`** - CSS modules for all normal pages. Uses modern CSS specifications.
- **`public/legacy/*.css`** - Broad compatibility CSS for error pages (`base.css`, supports IE 11).

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

- **Full Functionality Pages**: Reference `/main.ts`.
  - `index`
  - `about`
  - `artworks-and-videos`
  - `blogs-and-sponsor`
  - `chatting`
  - `softwares`
- **Error Pages with Minimal External Reference (`public/`)**: These pages (in `public/`) don't rely on any external JS scripts, external CSS stylesheets (except `/public/legacy/base.css`) or external CDNs, which means that they don't use features such as i18n or the Page Transition System. The page layout should be as close to Bootstrap 5.3 as possible, but can be appropriately simplified.
  - `404` -- HTTP 404 page (static, no JS framework)
  - `error-unsupported-browser`
  - `error-javascript-disabled`

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
