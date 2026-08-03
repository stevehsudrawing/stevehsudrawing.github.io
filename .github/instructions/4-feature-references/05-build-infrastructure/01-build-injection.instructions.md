---
description: >
  Build-time Injection: contentInjectionPlugin() Vite plugin, HAST tree manipulation,
  link-card builder (HAST JSON -> HTML), link-button-group builder.  Replaces #links containers,
  data-role="link-button-group" placeholders at build time.
  Use when: modifying Vite plugins, link-card/link-button-group JSON configs, or build-time injection.
applyTo: >
  build/content-injection-plugin.ts;
  build/builders/link-cards.ts;
  build/builders/link-button-groups.ts;
  build/configs/link-cards/**;
  build/configs/link-button-groups/**
---

#### 4.5.1 Build-time Injection

##### 4.5.1.1 contentInjectionPlugin()

Vite plugin with `transformIndexHtml` hook (order: `pre`). Extracts body
content -> HAST tree -> walk -> toHtml.

##### 4.5.1.2 processContentTree() Operations

| Operation                    | Trigger                                   | Status            |
| ---------------------------- | ----------------------------------------- | ----------------- |
| ~~Page component injection~~ | `data-role="page-component"`              | Removed (Phase 5) |
| ~~Language menu population~~ | `#lang-dropdown-menu`, `#language-select` | Removed (Phase 5) |
| Link card injection          | `#links` container                        | Active            |
| Link button group injection  | `data-role="link-button-group"`           | Active            |

##### 4.5.1.3 Link Cards

Config: `build/configs/link-cards/{pageName}.json` (HAST JSON format).
Builder: `build/builders/link-cards.ts` -> `buildLinkCardsHTML(pageName)`.

##### 4.5.1.4 Link Button Groups

Config: `build/configs/link-button-groups/{groupName}.json` (LinkButtonData format).
Builder: `build/builders/link-button-groups.ts` -> `buildLinkButtonGroupHTML(pageName, groupId)`.

##### 4.5.1.5 Future (Phase 7)

Link cards and button groups will be Vue-ified, simplifying or removing
the build-time injection plugin.
