---
description: >
  Markdown rendering and scrollspy navigation: MarkdownArticle.vue (marked
  -> HAST pipeline, heading extraction for sidebar scrollspy, table/link
  annotation, mobile collapsible heading bar).  Used on the Copyright and
  Worldview pages.
  Use when: modifying markdown rendering, scrollspy behavior, or adding new
  markdown-based pages.
applyTo: >
  src/components/ui/MarkdownArticle.vue
---

#### 4.2.10 Markdown Article

`MarkdownArticle.vue` renders raw Markdown content with a desktop
sticky sidebar scrollspy and a mobile collapsible heading bar.

##### 4.2.10.1 Rendering Pipeline

```
Markdown string (prop: content)
  -> marked.parse()          (Markdown -> HTML)
  -> fromHtml()              (HTML  -> HAST tree)
  -> processHastNode()       (recursive annotation walk)
  -> HastFragment            (HAST -> VNodes)
```

##### 4.2.10.2 HAST Annotation

The recursive `processHastNode()` walk:

- Removes `<h1>` (title is provided by the page hero section)
- Replaces `<h2>`–`<h6>` with a `<section-heading>` marker that
  `HastFragment` renders as `SectionHeading` (v3.11.2) — every heading
  gets anchor + copy-link buttons for free; the original inline children
  are kept as the heading's slot content so inline formatting (e.g.
  `` `code` ``) is preserved. `SectionHeading` derives the semantic tag
  and Bootstrap size class from its `level` prop (h2 → `.h4`, h3 → `.h5`,
  h4+ → `.h6` — see `09-section-headings` §4.2.9.1)
- Adds `.table` class to `<table>` elements
- Extracts heading text + id into the `headings` array for the scrollspy

##### 4.2.10.3 Scrollspy

| Mode    | Element                 |
| ------- | ----------------------- |
| Desktop | Sticky sidebar `<nav>`  |
| Mobile  | Collapsible heading bar |

Headings are collected from the HAST tree as plain text + id (`activeId`
is updated via throttled scroll handler). Clicking a heading scrolls to
the target with a dynamic offset:

```
desktop: scrollOffset prop (default 64)
mobile:  64 (navbar) + 48 (mobile bar) + mobileList.offsetHeight
```

##### 4.2.10.4 Usage

```vue
<MarkdownArticle :content="copyrightMd" page-path="/copyright-notice.html" />
```

Props: `content` (required raw markdown), `scrollOffset` (default 64),
`pagePath` (needed for heading copy-link URLs — without it the copy
button is hidden).

Used on `/copyright-notice.html` (CopyrightPage.vue, static `?raw` import)
and `/worldview.html` (WorldviewPage.vue, per-language selection via
`useMarkdownContent("worldview")` — see `01-i18n` §4.1.1.6). Static raw
import example:

```ts
import copyrightMd from "../../public/images/README.md?raw";
```

##### 4.2.10.5 Mobile List Animation (v3.10.3)

The mobile collapsible heading list (`ul.scrollspy-mobile-list`) animates
its expand/collapse with an **exact measured height** — the Vue
`<Transition>` hooks measure `scrollHeight` and animate `max-height` to
the real pixel value (no fixed `max-height` approximation), capped at the
resting `60vh` (`.scrollspy-mobile-list`) so long lists keep their
internal scroll. `prefers-reduced-motion` / `.no-animations` snap the
toggle via the global accessibility.css rules.

##### 4.2.10.6 Style Reconciliation (v3.11.2)

`SectionHeading`'s shared styles target the link-card context — a
shrink-wrapped `inline-flex` wrapper and `10px`/`1rem` heading margins.
When markdown headings render through it, `MarkdownArticle` overrides with
`:deep()` rules to preserve the article look: the wrapper becomes
`display: flex; width: 100%` and the heading `flex: 1 1 auto` so the
full-width `border-bottom` (from the `:deep(.article h*)` rule) still
spans the column; `margin-bottom` is restored to `0.5rem` (the
`0.5rem` top margin already wins by specificity).
