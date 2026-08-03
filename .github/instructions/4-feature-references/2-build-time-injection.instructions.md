---
description: >
  Build-time injection: Vite plugins for head tag injection (meta/SEO/OG/twitter/hreflang/JSON-LD),
  page component injection (header/footer/modals from build/page-components/), link card injection
  from HAST JSON, asset minification, link button group injection. Language menus pre-rendered at
  build time from language-list.json.
  Use when: modifying Vite plugins, build configs, page components, or adding new injection types.
applyTo: >
  build/**;
  vite.config.ts;
  build/configs/page-meta.ts
---

### 4.2 Build-time Injection

**Brief**: All dynamic content that was previously fetched or built at runtime (page components, link cards, language menus) is now pre-rendered into static HTML at build time by Vite plugins. This improves SEO and eliminates runtime fetch calls.

#### 4.2.1 Head Tag Injection

**Plugin**: `build/head-tags-plugin.ts`
**Config**: `build/configs/page-meta.ts`

All `<head>` meta/link/script tags are injected by a `transformIndexHtml` plugin (`order: 'pre'`). Only `charset` and `viewport` remain in the source HTML files.

Tag functions:

- `commonTags()` - Apple PWA, author, favicons, noscript fallback, env-detection
- `fullPageTags()` - manifest, sitemap, theme-color, splash screens (full-tier pages only)
- `seoTags(meta)` - `<title>`, description, robots, canonical
- `hreflangTags(meta)` - hreflang alternates for en/zh-Hans/zh-Hant/x-default
- `ogTags(meta)` - Open Graph tags
- `twitterTags(meta)` - Twitter/X Card tags
- `structuredData(meta)` - JSON-LD (Person+WebSite for homepage, BreadcrumbList for sub-pages)

**Page Tiers**:

| Tier   | Entry Script | Pages                                                                     |
| ------ | ------------ | ------------------------------------------------------------------------- |
| `full` | `/main.ts`   | index, about, artworks-and-videos, blogs-and-sponsor, chatting, softwares |

**Adding a New Page**:

1. Create `src/new-page.html` with minimal `<head>` (charset + viewport only).
2. Add an entry to `PAGE_META` in `build/configs/page-meta.ts`.
3. Add the HTML file to `rollupOptions.input` in `vite.config.ts`.

#### 4.2.2 Page Component Injection

**Plugin**: `build/content-injection-plugin.ts`
**Source fragments**: `build/page-components/*.html`

Placeholder `<div>` elements marked with `data-role="page-component"` and `data-component-name` are replaced at build time with the actual component HTML. The runtime `component-loader.ts` has been removed - components are now part of the delivered HTML.

**How It Works**:

```
HTML source: <div data-role="page-component" data-component-name="header"></div>
  ↓ (content-injection-plugin, transformIndexHtml order: 'pre')
Parses body content with fromHtml() -> walks HAST tree -> finds dataRole === 'page-component'
  ↓
Reads build/page-components/{name}.html -> extracts inner <body> content
  ↓
Replaces placeholder children with component content, removes dataRole/dataComponentName attrs
  ↓
Serializes back to HTML with toHtml()
```

The `dataRole` and `dataComponentName` attributes are removed after injection - this prevents any residual runtime loader from attempting to re-fetch and overwrite the pre-rendered content.

Additionally, the language menus (`#lang-dropdown-menu` in the header and `#language-select` in the settings modal) are populated at build time from `build/configs/language-list.json`. The runtime `loadSupportedLangs()` and `populateLanguageMenus()` functions in `i18n.ts` have been removed. Language switching still works at runtime via `loadLang()` and `setActiveLangItem()` - only the static menu population is pre-rendered.

#### 4.2.3 Link Card Injection

**Plugin**: `build/content-injection-plugin.ts` (calls `build/builders/link-cards.ts`)
**Config**: `build/configs/link-cards/*.json` (HAST format)

Link cards are pre-rendered from HAST JSON configs and injected into the `#links` container. No runtime DOM construction or JSON fetching is needed.

**How It Works**:

```
buildLinkCardsHTML(pageName)
  ↓ Reads build/configs/link-cards/{pageName}.json
  ↓ For each group:
      - Builds group title with hash/copy anchors (h() + toHtml)
      - Processes description HAST
      - For each card:
          * Adds data-link-img-props to all <a> elements
          * Appends QR buttons to title <a> elements only (not description links)
          * Ensures img-fluid img-fit classes on icon images
  ↓ Returns serialized HTML string
  ↓ content-injection-plugin finds #links container in HAST tree -> replaces children
```

All operations are performed on HAST node trees using `hastscript` (`h()`) and `hast-util-to-html` (`toHtml`). The `fromHtml` function is used for parsing HTML strings into HAST trees for manipulation. No regex-based HTML string replacement is used.

**Related Files**:

| File                                   | Role                                                          |
| -------------------------------------- | ------------------------------------------------------------- |
| `build/builders/link-cards.ts`         | HAST-based card/group HTML generator                          |
| `build/content-injection-plugin.ts`    | Vite plugin - calls link-cards builder, injects into `#links` |
| `build/configs/link-cards/{page}.json` | HAST JSON card definitions                                    |
| `build/types.ts`                       | `CardData`, `GroupData` interfaces                            |

#### 4.2.5 Link Button Group Injection

**Plugin**: `build/content-injection-plugin.ts` (calls `build/builders/link-button-groups.ts`)
**Config**: `build/configs/link-button-groups/*.json` (simplified format)

Link button groups are pre-rendered from simplified JSON configs (not full HAST) and injected into placeholder elements. Each button is defined by `externalLink`, `linkHref`, and `iconProps` - the builder converts these into HAST `<a>` elements with `<img>` children.

**How It Works**:

```
buildLinkButtonGroupHTML(pageName, groupId)
  ↓ Reads build/configs/link-button-groups/{pageName}.json
  ↓ Finds the group with matching groupId
  ↓ For each button:
      - Derives data-bs-title from iconProps.alt
      - Derives data-i18n-tooltip from iconProps.dataI18nAlt
      - Sets data-link-img-props (external links) or data-no-qr-code (internal links)
      - Builds <a> with btn btn-outline-secondary link-btn-img-wrapper classes
  ↓ Wraps all buttons in <div class="btn-group link-button-group">
  ↓ Returns serialized HTML string
  ↓ content-injection-plugin finds data-role="link-button-group" -> replaces children
```

**Placeholder format** (in source HTML):

```html
<div data-role="link-button-group" data-group-id="artworks"></div>
```

**Related Files**:

| File                                           | Role                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| `build/builders/link-button-groups.ts`         | Builds button-group HTML from simplified JSON configs  |
| `build/content-injection-plugin.ts`            | Vite plugin - calls builder, injects into placeholders |
| `build/configs/link-button-groups/{page}.json` | Simplified button-group definitions (one per page)     |
| `build/types.ts`                               | `LinkButtonData`, `LinkButtonGroupData` interfaces     |

#### 4.2.4 Asset Minification

**Plugin**: `build/minify-plugin.ts`
**Dependency**: `html-minifier-terser` (dev)

After Vite finishes bundling, the `closeBundle` hook walks `dist/` and minifies all static assets:

| Type           | Method                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `*.html`       | `html-minifier-terser` - collapseWhitespace, removeComments, removeRedundantAttributes; protects JSON-LD and `<noscript>` via `ignoreCustomFragments` |
| `*.json`       | `JSON.stringify(JSON.parse(...))` - compact single-line                                                                                               |
| `legacy/*.css` | Regex: strip comments, collapse whitespace (Vite-bundled CSS already minified)                                                                        |
| `legacy/*.js`  | Regex: strip comments, collapse whitespace (Vite-bundled JS already minified)                                                                         |
| `*.xml`        | Regex: remove inter-tag whitespace                                                                                                                    |
