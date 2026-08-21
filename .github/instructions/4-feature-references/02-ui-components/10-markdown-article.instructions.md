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
  -> toHtml()                (HAST  -> final HTML)
```

##### 4.2.10.2 HAST Annotation

The recursive `processHastNode()` walk:

- Annotates `<table>` with `.table` class
- Annotates all `<a>` with `.link`
- Annotates outbound `<a>` with `.external-link` + `data-no-qr-code`
- Extracts heading text + id for the scrollspy sidebar

##### 4.2.10.3 Scrollspy

| Mode    | Element                 |
| ------- | ----------------------- |
| Desktop | Sticky sidebar `<nav>`  |
| Mobile  | Collapsible heading bar |

Headings are extracted from the HAST tree (h2 -> `.h4`, h3 -> `.h5`).
`activeId` is updated via throttled scroll handler. Clicking a heading
scrolls to the target with a dynamic offset:

```
desktop: scrollOffset prop (default 64)
mobile:  64 (navbar) + 48 (mobile bar) + mobileList.offsetHeight
```

##### 4.2.10.4 Usage

```vue
<MarkdownArticle :content="copyrightMd" />
```

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
