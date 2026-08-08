---
description: >
  Page Chain Navigation: core/page-chain.ts (linked-list config + getPageNavLinks()),
  PageChainNav.vue (Previous/Next nav component).  Defines traversal order across
  pages for bidirectional prev/next links.
  Use when: modifying page traversal order, adding pages to the chain, or changing
  PageChainNav layout.
applyTo: >
  src/core/page-chain.ts;
  src/components/nav/PageChainNav.vue
---

#### 4.4.3 Page Chain Navigation

##### 4.4.3.1 Architecture

```
core/page-chain.ts
  ├─ MAIN_CHAIN: ["artworks-and-videos", "softwares", ...]
  ├─ LEAVES: { "copyright-notice": "index" }
  └─ getPageNavLinks(pageName) → { prev?, next? }

PageChainNav.vue
  ├─ Props: { pageName: string }
  ├─ calls getPageNavLinks(pageName)
  └─ renders prev (←, link-secondary-shlh) / next (→, link-primary)
     with empty spacers when one direction has no link
```

##### 4.4.3.2 Chain Structure

```
index ← artworks ↔ softwares ↔ blogs ↔ chatting ↔ about
index ← copyright-notice
```

- **index**: Root page — no prev/next links of its own
- **Main chain**: bidirectional between artworks and about
- **Leaves**: single-direction back to index

##### 4.4.3.3 Usage

```vue
<PageChainNav page-name="softwares" />
```

Supports all 6 non-index pages: `artworks-and-videos`, `softwares`,
`blogs-and-sponsor`, `chatting`, `about`, `copyright-notice`.
