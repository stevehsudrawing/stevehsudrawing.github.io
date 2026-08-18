---
description: >
  Build-time Injection: contentInjectionPlugin() Vite plugin generates auto
  <noscript> SEO content from link-card / link-button-group JSON configs
  (plain-text link lists for crawlers).
  Use when: modifying the noscript content generation, or the link-card /
  link-button-group JSON configs.
applyTo: >
  build/content-injection-plugin.ts;
  src/configs/link-cards/**;
  src/configs/link-button-groups/**
---

#### 4.5.1 Build-time Injection

##### 4.5.1.1 contentInjectionPlugin()

Vite plugin with `transformIndexHtml` hook (order: `pre`). For each full page
it reads the page's link-card JSON
(`src/configs/link-cards/{pageName}.json`) and link-button-group JSON
(`src/configs/link-button-groups/{pageName}.json`), generates a plain-text
`<h3>` / `<ul><li><a>` list, and injects it before `</noscript>` so crawlers
can index the links without executing JavaScript.

##### 4.5.1.2 Text Resolution

Group / card / button titles and labels resolve from their `id` via
`t("text-" + id)`. At build time this reads `src/configs/i18n/en.json` (the
single source of truth; zh-Hans / zh-Hant naturally fall back to en). A
button/card `imgProps.alt`, when present, is preferred for the label.

##### 4.5.1.3 Link Cards

Config: `src/configs/link-cards/{pageName}.json` (`LinkCardGroupData[]`).
Hrefs come directly from `card.titleLink.href`; descriptions are flattened
with `extractPlainText`.

##### 4.5.1.4 Link Button Groups

Config: `src/configs/link-button-groups/{pageName}.json`
(`LinkButtonGroupData[]`). Hrefs come from `button.link.href`; group headings
are derived from `groupId` (dash-case → Title Case).
