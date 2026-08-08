---
description: >
  Build-time Injection: contentInjectionPlugin() Vite plugin, HAST tree manipulation,
  link-card builder (HAST JSON -> HTML), link-button-group builder.  Replaces #links containers,
  data-role="link-button-group" placeholders at build time.
  Use when: modifying Vite plugins, link-card/link-button-group JSON configs, or build-time injection.
applyTo: >
  build/content-injection-plugin.ts;
  src/configs/link-cards/**;
  src/configs/link-button-groups/**
---

#### 4.5.1 Build-time Injection

##### 4.5.1.1 contentInjectionPlugin()

Vite plugin with `transformIndexHtml` hook (order: `pre`). Extracts body
content -> HAST tree -> walk -> toHtml.

##### 4.5.1.2 processContentTree() Operations

| Operation                   | Trigger                         | Status |
| --------------------------- | ------------------------------- | ------ |
| Link card injection         | `#links` container              | Active |
| Link button group injection | `data-role="link-button-group"` | Active |

##### 4.5.1.3 Link Cards

Config: `src/configs/link-cards/{pageName}.json` (HAST JSON format).
Rendered at build time by `content-injection-plugin.ts`.

##### 4.5.1.4 Link Button Groups

Config: `src/configs/link-button-groups/{groupName}.json` (LinkButtonData format).
Rendered at build time by `content-injection-plugin.ts`.
