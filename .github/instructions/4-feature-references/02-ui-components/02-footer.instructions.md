---
description: >
  Footer: FooterNav.vue (copyright, external links, QR share trigger).  Uses data-link-img-props
  and data-qr-url attributes for App.vue event delegation.  Powered-by text via $t() with v-html.
  Use when: modifying footer content, links, or layout.
applyTo: >
  src/components/nav/FooterNav.vue
---

#### 4.2.2 Footer

##### 4.2.2.1 Architecture

```
FooterNav.vue
  └─ Template-only (no script imports needed — $t() from plugin)
```

##### 4.2.2.2 Sections

| Section                 | Content                                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| Copyright               | `&copy; 2024-2026` + internal link to `/about.html` + `v-b-tooltip.top.lazy` |
| Powered by              | `v-html="$t('html-powered-by')"` — inline HTML from i18n JSON                |
| Issue + Copyright links | External links with `data-link-img-props` JSON + `data-no-qr-code`           |
| Share + View Code       | QR trigger (`data-qr-url` + `data-qr-icon`) + GitHub link                    |

##### 4.2.2.3 Event Delegation

Footer links use `data-link-img-props` and `data-qr-url` data attributes.
App.vue's delegated click handlers read these attributes and populate the
corresponding modal props.
