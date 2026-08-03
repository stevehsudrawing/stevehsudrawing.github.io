---
description: >
  Footer: FooterNav.vue (copyright, external links, QR share trigger).  Uses data-link-img-props
  and data-qr-url attributes for App.vue event delegation.  HAST-powered-by i18n rendering.
  Use when: modifying footer content, links, or layout.
applyTo: >
  src/components/layout/FooterNav.vue
---

#### 4.2.2 Footer

##### 4.2.2.1 Architecture

```
FooterNav.vue
  ├─ State: useI18n() → messages, renderHast()
  └─ Template-only (no Actions / Expose)
```

##### 4.2.2.2 Sections

| Section                 | Content                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| Copyright               | `&copy; 2024-2026` + internal link to `/about.html` + `v-b-tooltip`           |
| Powered by              | HAST rendering via `v-html="poweredByHtml"` (uses `hast-powered-by` i18n key) |
| Issue + Copyright links | External links with `data-link-img-props` JSON + `data-no-qr-code`            |
| Share + View Code       | QR trigger (`data-qr-url` + `data-qr-icon`) + GitHub link                     |

##### 4.2.2.3 HAST-Powered-By

The "Powered by Vite" text is stored as a HAST JSON object in i18n files
(`hast-powered-by` key). `renderHast()` uses `hast-util-to-html` to convert
the HAST tree to an HTML string for `v-html`.

##### 4.2.2.4 Event Delegation

Footer links use `data-link-img-props` and `data-qr-url` data attributes.
App.vue's delegated click handlers read these attributes and populate the
corresponding modal props.
