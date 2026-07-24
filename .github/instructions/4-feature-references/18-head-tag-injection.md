### 4.18 Head Tag Injection

**Brief**: All `<head>` meta/link/script tags are injected at build time by a Vite `transformIndexHtml` plugin. Only `charset` and `viewport` remain in the source HTML files — everything else is generated programmatically from a central configuration.

**Related Files**:

| File                       | Role                                                                     |
|----------------------------|--------------------------------------------------------------------------|
| `vite.config.js`           | `injectHeadTags` plugin with `transformIndexHtml` hook                   |
| `src/configs/page-meta.js` | Per-page metadata (title, description, path, robots, JSON-LD type, tier) |

**How It Works**:

```
HTML source: <head><meta charset><meta viewport></head>
  ↓ (transformIndexHtml hook, order: 'pre')
Reads ctx.filename → extracts page name → looks up PAGE_META[pageName]
  ↓
Generates HtmlTagDescriptor[] from 7 tag functions:
  commonTags()     — Apple PWA, author, favicons, noscript, env-detection
  fullPageTags()   — manifest, sitemap, theme-color, splash screens
  seoTags(meta)    — title, description, robots, canonical
  hreflangTags(meta) — hreflang alternates for en/zh-Hans/zh-Hant/x-default
  ogTags(meta)     — Open Graph tags
  twitterTags(meta)— Twitter/X Card tags
  structuredData(meta) — JSON-LD (Person+WebSite for homepage, BreadcrumbList for sub-pages)
  ↓
Tags injected into <head> → identical output as the previous hardcoded approach.
```

**Page Tiers**:

| Tier | `PAGE_META.tier` | Entry Script | Pages |
|------|-------------------|-------------|-------|
| `full` | `'full'` | `/src/main.ts` | index, about, artworks-and-videos, blogs-and-sponsor, chatting, softwares |
| `lightweight` | `'lightweight'` | `/src/main-lightweight.ts` | 404 — excludes manifest, sitemap, theme-color, splash screens |
| `none` | (not in page-meta) | (none) | error-* pages — hand-written `<head>` |

**Adding a New Page**:

1. Create `new-page.html` with minimal `<head>` (charset + viewport only).
2. Add an entry to `PAGE_META` in `src/configs/page-meta.js`.
3. Add the HTML file to `rollupOptions.input` in `vite.config.js`.
4. All `<head>` tags are generated automatically.


