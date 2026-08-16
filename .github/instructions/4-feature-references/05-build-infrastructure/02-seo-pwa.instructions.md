---
description: >
  SEO & PWA: head-tags-plugin.ts (meta/SEO/OG/twitter/hreflang/JSON-LD injection),
  sitemap-plugin.ts (sitemap.xml with hreflang alternates), PWA manifest,
  Apple PWA splash screens.  SEO elements vary by page tier (full/error).
  Use when: modifying SEO metadata, structured data, sitemap, or PWA configuration.
applyTo: >
  build/head-tags-plugin.ts;
  build/sitemap-plugin.ts;
  build/content-injection-plugin.ts;
  public/manifest.json;
  public/robots.txt;
  build/site-meta.ts
---

#### 4.5.2 SEO & PWA

##### 4.5.2.1 head-tags-plugin.ts

Injects per-page `<head>` content at build time:

- `<meta>` tags (description, viewport, theme-color)
- Open Graph (`og:title`, `og:description`, `og:image`)
- Twitter/X Card (`twitter:card: summary_large_image`)
- `<link rel="alternate" hreflang="...">` for language variants
- JSON-LD structured data (`Person` on homepage, `WebSite` + `BreadcrumbList` on sub-pages).
  The Person `sameAs` array is derived from `src/configs/link-button-groups/index.json`
  (external buttons flagged `sameAs: true`) — never hardcoded.

##### 4.5.2.2 sitemap-plugin.ts

Generates `sitemap.xml` with `<url>` entries and `<xhtml:link>` hreflang
alternates. `lastmod` set to build date.

##### 4.5.2.3 content-injection-plugin.ts

At build time, reads `src/configs/link-cards/*.json` and
`src/configs/link-button-groups/*.json` and generates plain-text link lists
inside each page's `<noscript>` block. This allows search engine crawlers
to index link-card titles, descriptions, and URLs without executing
JavaScript.

Generated structure (per page):

```html
<noscript>
  <!-- static content -->
  <!-- auto-generated: link cards -->
  <h3>Group Title</h3>
  <ul>
    <li><a href="...">Card Title</a> — Card Description</li>
  </ul>
</noscript>
```

##### 4.5.2.4 PWA

- `public/manifest.json` — PWA manifest (name, icons, theme_color, standalone)
- Apple splash screens via `tools/apple-pwa-splash-generator/` (23 resolutions)

##### 4.5.2.5 Page Tiers

| Tier    | Pages                                              | SEO Elements                                   |
| ------- | -------------------------------------------------- | ---------------------------------------------- |
| `full`  | index, about, artworks, blogs, chatting, softwares | Full: meta + OG + Twitter + hreflang + JSON-LD |
| `error` | 404, error-*                                       | Minimal: basic meta only                       |

##### 4.5.2.6 robots.txt

Whitelists known crawlers. Located at `public/robots.txt`.
