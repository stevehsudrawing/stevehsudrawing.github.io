---
description: >
  HAST → Vue Rendering: TypeAwareLink.vue (smart link: external/internal/email/anchor),
  HastFragment.vue (recursive HAST→VNode renderer), useHastToVue.ts (HAST property
  extraction helpers).  Replaces all v-html and event delegation for HAST content.
  Use when: modifying HAST rendering, adding link types, or changing HAST property extraction.
applyTo: >
  src/components/links/TypeAwareLink.vue;
  src/components/render-functions/HastFragment.vue;
  src/composables/useHastToVue.ts
---

#### 4.2.14 HAST → Vue Rendering

##### 4.2.14.1 Architecture

```
useHastToVue.ts
  ├─ extractPictureProps(node) → FeatureAwarePictureProps
  ├─ extractColoredImgProps(node) → ColoredImgProps
  └─ extractLinkProps(node) → { type, href, ... }

HastFragment.vue
  ├─ Props: { nodes: HastNode[] }
  ├─ Recursive h() renderer:
  │    <a>   → TypeAwareLink
  │    <img> → FeatureAwarePicture or ColoredImg (based on dataImgFeature)
  │    text  → data-i18n resolution → $t() or raw text
  │    other → native element via h(tagName, vueProps, children)
  └─ Replaces all v-html usage (LinkCard, MarkdownArticle)

TypeAwareLink.vue
  ├─ Props: TypeAwareLinkProps (shared in types/app.ts — also used by
  │    gallery.json relatedLink configs):
  │    { href, type, icon?, noQRCode?, hideIndicator? }
  ├─ type detection: # → anchor, mailto:/tel: → email,
  │   .internal-link → internal, scheme-less href → internal,
  │   default → external
  ├─ Icons: bi-arrow-up-right (external), bi-envelope (email),
  │   bi-paragraph (anchor) — suppressed for image-only links
  ├─ QRCodeButton: shown only when icon present AND noQRCode !== true
  └─ onClick: inject(OPEN_EXTERNAL_LINK_KEY) | router.push() | scrollToHashTarget()
```

##### 4.2.14.2 Link Type Detection

| Condition                    | Type       | Click Handler                         |
| ---------------------------- | ---------- | ------------------------------------- |
| `href` starts with `#`       | `anchor`   | `scrollToHashTarget(hash)`            |
| `href` starts with `mailto:` | `email`    | Native browser behavior               |
| `.internal-link` class       | `internal` | `router.push(href)`                   |
| Scheme-less href (`/...` or  | `internal` | `router.push(href)`                   |
| relative, incl. query)       |            | (v3.11.1 — markdown links)            |
| Else                         | `external` | `openExternalLink(url, icon, hideQR)` |

##### 4.2.14.3 Usage

```vue
<!-- HastFragment: recursive HAST rendering -->
<HastFragment :nodes="hastChildren" />

<!-- TypeAwareLink: any link with type-aware behavior -->
<TypeAwareLink
  type="external"
  href="https://..."
  :icon="{ type: 'picture', imgProps: {...} }"
/>
```
