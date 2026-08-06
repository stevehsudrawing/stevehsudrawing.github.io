---
description: >
  Utilities: path normalization (normalizeInternalPath, extractPageName, isInternalPage),
  DOM helpers (setElementAttributes, extractPlainText), page title update, internal page
  lists (INTERNAL_PAGES, EXCLUDED_PAGES), dash-case conversion (toDashCase).
  Use when: adding shared utility functions or modifying existing ones.
applyTo: >
  src/core/utils.ts;
  src/ui/page-title.ts;
  src/features/page-content-initializer.ts
---

#### 4.5.3 Utilities

##### 4.5.3.1 Path Utilities (`src/core/utils.ts`)

| Function                      | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `normalizeInternalPath(path)` | Normalize to `/lowercase.html`      |
| `extractPageName(path)`       | `/about.html` -> `about`            |
| `isInternalPage(href)`        | Check if internal page              |
| `toDashCase(str)`             | camelCase / PascalCase -> dash-case |

##### 4.5.3.2 DOM Utilities (`src/core/utils.ts`)

| Function                          | Purpose              |
| --------------------------------- | -------------------- |
| `setElementAttributes(el, props)` | Batch-set attributes |
| `extractPlainText(html)`          | Strip HTML tags      |

##### 4.5.3.3 Internal Page Lists

```ts
const INTERNAL_PAGES = [
  "/index.html",
  "/about.html",
  "/artworks-and-videos.html",
  "/blogs-and-sponsor.html",
  "/chatting.html",
  "/softwares.html",
  "/copyright-notice.html",
];
const EXCLUDED_PAGES = [
  "/404.html",
  "/error-javascript-disabled.html",
  "/error-unsupported-browser.html",
];
```

##### 4.5.3.4 Page Title (`src/ui/page-title.ts`)

`updatePageTitle(pageName)` sets `document.title` based on page and language.

##### 4.5.3.5 Page Content Initializer

`initPageContent()` (legacy) orchestrates re-initialization after SPA transitions.
Will be replaced by per-page `onMounted` in Phase 7.
