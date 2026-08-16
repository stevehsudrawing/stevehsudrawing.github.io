---
description: >
  Utilities: path normalization (normalizeInternalPath, extractPageName),
  DOM helpers (extractPlainText), page title update, internal page lists
  (INTERNAL_PAGES, EXCLUDED_PAGES), dash-case conversion (toDashCase). Use
  when: adding shared utility functions or modifying existing ones.
applyTo: >
  src/core/utils.ts;
  src/platform/page-title.ts
---

#### 4.5.3 Utilities

##### 4.5.3.1 Path Utilities (`src/core/utils.ts`)

| Function                      | Purpose                             |
| ----------------------------- | ----------------------------------- |
| `normalizeInternalPath(path)` | Normalize to `/lowercase.html`      |
| `extractPageName(path)`       | `/about.html` -> `about`            |
| `toDashCase(str)`             | camelCase / PascalCase -> dash-case |

##### 4.5.3.2 DOM Utilities (`src/core/utils.ts`)

| Function                 | Purpose         |
| ------------------------ | --------------- |
| `extractPlainText(html)` | Strip HTML tags |

##### 4.5.3.3 Internal Page Lists (`src/configs/pages.ts`)

Page names live once in `PAGE_NAMES`; `INTERNAL_PAGES` is derived from it.
`build/types.ts` derives `PageName` from the same source, so `PAGE_META`
must cover every page (compile-time completeness check).

```ts
const PAGE_NAMES = [
  "index",
  "about",
  "artworks-and-videos",
  "blogs-and-sponsor",
  "chatting",
  "softwares",
  "copyright-notice",
] as const;

const INTERNAL_PAGES = PAGE_NAMES.map((name) => `/${name}.html`);

const EXCLUDED_PAGES = [
  "/404.html",
  "/error-javascript-disabled.html",
  "/error-unsupported-browser.html",
] as const;
```

##### 4.5.3.4 Page Title (`src/platform/page-title.ts`)

`updatePageTitle(pageName)` sets `document.title` based on page and language.

##### 4.5.3.5 Page Content Initializer

Page lifecycle is managed by Vue component `onMounted` in each `*Page.vue`.
