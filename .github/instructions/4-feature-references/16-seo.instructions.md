---
description: >
  SEO: meta tags, structured data (JSON-LD Person schema with sameAs for homepage, WebSite with
  SearchAction, BreadcrumbList for sub-pages), sitemap.xml with hreflang alternates, hreflang link
  tags (en/zh-Hans/zh-Hant/x-default), Open Graph tags, Twitter/X Card tags (summary_large_image),
  PWA manifest, noscript SEO fallback in body, heading hierarchy, crawler whitelist. SEO elements
  vary by page tier (full/lightweight/error).
  Use when: modifying head-tags-plugin.ts, page-meta.ts, sitemap.xml, robots.txt, or page metadata.
applyTo: >
  build/head-tags-plugin.ts;
  build/configs/page-meta.ts;
  public/robots.txt;
  public/sitemap.xml;
  public/manifest.json;
  *.html
---

### 4.16 SEO

**Brief**: Search engine optimization via meta tags, structured data (JSON-LD), sitemap, hreflang, Open Graph, Twitter Cards, and PWA manifest. Applied across all full-functionality pages and the 404 page.

**Related Files**:

| File            | Role                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `sitemap.xml`   | XML sitemap listing all indexable pages with hreflang                  |
| `manifest.json` | PWA web app manifest for mobile install experience                     |
| `robots.txt`    | Crawler directives; blocks AI bots from `/images/`; references sitemap |

#### 4.16.1 SEO Elements by Page Tier

| Element                   | Full-Functionality Pages                                | 404 (Lightweight) | Error Pages (Minimal) |
| ------------------------- | ------------------------------------------------------- | ----------------- | --------------------- |
| `meta description`        | ✓ Unique per page                                       | ✓                 | ✓                     |
| `meta author`             | ✓                                                       | ✓                 | ✓                     |
| `meta robots`             | ✓ `index, follow`                                       | ✓ `noindex`       | ✓ `noindex`           |
| `link canonical`          | ✓                                                       | ✓                 | ✓                     |
| `<title>`                 | ✓ `{Page} - Steve Hsu (什五)'s Link-Hub`                | ✓                 | ✓                     |
| `link favicon`            | ✓                                                       | ✓                 | ✓                     |
| `link manifest`           | ✓                                                       | ✗                 | ✗                     |
| Apple PWA meta tags       | ✓ `apple-mobile-web-app-capable` + others               | ✓                 | ✓                     |
| `link sitemap`            | ✓                                                       | ✗                 | ✗                     |
| Hreflang `<link>`s        | ✓ en, zh-Hans, zh-Hant, x-default                       | ✓                 | ✗                     |
| Open Graph tags           | ✓                                                       | ✓                 | ✓                     |
| `og:locale:alternate`     | ✓ zh_Hans_CN, zh_Hant_TW                                | ✓                 | ✗                     |
| Twitter/X Card tags       | ✓ `summary_large_image`                                 | ✓                 | ✓                     |
| Multiple `theme-color`    | ✓                                                       | ✓                 | ✗                     |
| JSON-LD (inline)          | ✓ See [§4.16.2](16-seo.instructions.md#4162-structured-data-json-ld) | ✗                 | ✗                     |
| `<noscript>` SEO fallback | ✓ In `<body>`, core text + key links                    | ✗                 | ✗                     |

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
  - `?lang=en` - English
  - `?lang=zh-Hans` - Simplified Chinese
  - `?lang=zh-Hant` - Traditional Chinese
- The `x-default` hreflang points to the parameter-less URL, signaling that the page does not specifically target any one language and will auto-detect based on saved preference.
- Language detection priority: `?lang=` query parameter → `localStorage` (`preferredLang`) → default `'en'`.
- When the user switches language via the UI, `history.replaceState()` updates the URL with the new `?lang=` parameter without creating a browser history entry.
- The Page Transition System ([§4.6](6-page-transitions.instructions.md#46-page-transitions)) preserves the `?lang=` parameter across internal SPA navigations, so the user's chosen language persists through page transitions.
- Hreflang `<link>` tags in `<head>` use the `?lang=` URLs to give each language a unique URL for search engines.
- Language code normalization: a `normalizeLang()` function (in `src/core/i18n.ts`) maps common regional variants to the site's three supported codes. This is called at the entry of `loadLang()`, ensuring all language inputs (URL parameters, localStorage values, UI selections) are canonicalized before translation files are loaded:
  - `zh-HK`, `zh-MO`, `zh-TW`, `zh-Hant`, `zh-Hant-*` → `zh-Hant`
  - `zh-CN`, `zh-SG`, `zh`, `zh-Hans`, `zh-Hans-*` → `zh-Hans`
  - Other `zh-*` variants → `zh-Hans` (fallback)
  - `en`, `en-*`, any unrecognized code → `en` (default)
- Hreflang tags only declare these three canonical codes; regional variants are not listed to avoid false duplicate-content signals.

#### 4.16.5 Noscript SEO Fallback

- Each full-functionality page includes a `<noscript>` block at the top of `<body>`.
- Contains the page title (`<h2 class="h1">`) and a descriptive paragraph (`<p>`). The `<h2>` avoids conflicting with the page's sole `<h1>` (see [§4.16.6](#4166-heading-hierarchy)).
- The homepage noscript additionally includes a `<ul>` of key platform links.
- This is purely for search engine crawlers; users without JS are redirected by the `<head>` noscript before seeing this content.

#### 4.16.6 Heading Hierarchy

- **Every page must have exactly one `<h1>`**. This is the primary SEO heading signal. Multiple `<h1>`s dilute ranking and are flagged as critical issues by SEO tools.
- The `<h1>` must be **pure text** - no `<a>` links, no inline markup beyond semantic phrasing elements. Links dilute the heading keyword signal.
- **Sub-section headings** (e.g. "My Softwares", "Blogs & Sponsor") use `<h2 class="h1">`. The `.h1` class applies the same font size as `<h1>` while preserving correct heading hierarchy for SEO and accessibility.
- **`<noscript>` fallback headings** use `<h2 class="h1">` to avoid creating a second `<h1>` that search engines would count against the page.

#### 4.16.7 Homepage H1 Rich Text

- The homepage `<h1>` uses `data-i18n-html="html-steve-hsu-s-link-hub"` with inline HTML markup.
- The translation string includes `<span class="color-primary">` to brand the name with the site's primary color (defined in `src/stylesheets/theme.css`).
- This approach allows per-language flexibility: the name can appear at the beginning, middle, or end of the title depending on the language's grammar.
- The English fallback text between the tags serves as both the default rendering and the English translation.

#### 4.16.8 Crawler Whitelist

- `public/legacy/env-detection.js` must whitelist known search engine bots and SEO crawlers via the `isBotOrCrawler()` function. Bots are identified by UA string matching because some crawlers run limited JS engines that may not support optional chaining.
- Without this whitelist, crawlers with User-Agents that do not match recognized browser patterns are detected as \"unsupported\" and redirected to `error-unsupported-browser.html`, which has `robots: noindex`. This would prevent the site from being indexed.
- The whitelist covers:
  - **Search engines**: Googlebot, Bingbot, Baiduspider, Yandex, DuckDuckGo, Yahoo Slurp, Sogou, 360Spider
  - **Social media**: Facebook, Twitter/X, LinkedIn, Discord
  - **SEO tools**: Ahrefs, SEMrush, Moz, Majestic, Sitebulb, Seobility, Screaming Frog
  - **AI crawlers**: GPTBot (OpenAI), ClaudeBot (Anthropic), PerplexityBot, DeepSeekBot
  - **Generic fallback**: any UA containing `bot`, `crawler`, `spider`, or `scraper` is also allowed
- `isBotOrCrawler()` is called at the top of `isBrowserSupported()`; if it returns `true`, the browser is treated as supported regardless of version detection.
