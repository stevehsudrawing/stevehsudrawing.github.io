---
description: >
  Section headings with anchor and copy-link buttons: SectionHeading.vue (h2
  with dash-case id + AnchorButton + CopyButton), AnchorButton.vue (smooth-scroll
  anchor with tooltip), CopyButton.vue (clipboard copy with toast feedback).
  Use when: modifying heading anchor behavior, copy-link UX, or heading ID generation.
applyTo: >
  src/components/ui/SectionHeading.vue;
  src/components/buttons/AnchorButton.vue;
  src/components/buttons/CopyButton.vue
---

#### 4.2.9 Section Headings & Anchors

##### 4.2.9.1 SectionHeading.vue

Renders an `<h2>` with an auto-generated `dash-case` id (or an explicit
`headingId` for i18n-stable anchors), plus `AnchorButton` for permalink
sharing and `CopyButton` for clipboard copy.

| Prop        | Type      | Notes                                           |
| ----------- | --------- | ----------------------------------------------- |
| `title`     | `string`  | Display text + fallback id source               |
| `headingId` | `string?` | Stable, language-independent anchor id          |
| `pagePath`  | `string?` | Needed for copy-link URL (e.g. `"/about.html"`) |

The copy-link URL is built as `BASE_URL + pagePath + #id`, where `BASE_URL`
is imported directly from `src/core/page-meta.ts` (no `baseUrl` prop).

When `headingId` is omitted, the id is derived from `title` via
`toDashCase()`. When the title is an i18n string (language-dependent),
always provide an explicit `headingId` so anchor links remain valid
after language switches.

##### 4.2.9.2 AnchorButton.vue

Renders `<a href="#targetId">` with the paragraph icon (`bi-paragraph`),
Bootstrap tooltip, and smooth-scroll (64 px navbar offset).

Props: `targetId` (required), `headingTitle` (required — used for
`aria-label` via the `text-anchor-to-x` i18n key with `%1` placeholder).

The tooltip always shows the generic `text-anchor` text (short), while
`aria-label` uses the context-aware `text-anchor-to-x` format (e.g.
"Anchor to Profile").

##### 4.2.9.3 CopyButton.vue

Renders a clickable element that copies `copyText` to the clipboard and
shows a toast notification. Used for color codes and heading permalinks.

Props: `copyText` (required), `tag` (default `"span"`).
Slot: button content (icon, text).
