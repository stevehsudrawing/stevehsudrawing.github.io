---
description: >
  Footer: FooterNav.vue (copyright, external links, QR share trigger).  Uses data-link-img-props
  and data-qr-url attributes for App.vue event delegation.  Powered-by text via $t() with v-html.
  Use when: modifying footer content, links, or layout.
applyTo: >
  src/components/layout/FooterNav.vue
---

#### 4.2.2 Footer

##### 4.2.2.1 Architecture

```
FooterNav.vue
  └─ Template-only (no script imports needed — $t() from plugin)
```

##### 4.2.2.2 Sections

| Section                 | Content                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| Copyright               | `&copy; 2024-2026` + internal link to `/about.html` + `v-b-tooltip` |
| Powered by              | `v-html="$t('html-powered-by')"` — inline HTML from i18n JSON       |
| Issue + Copyright links | External links with `data-link-img-props` JSON + `data-no-qr-code`  |
| Share + View Code       | QR trigger (`data-qr-url` + `data-qr-icon`) + GitHub link           |

> **Phase 7 note:** The "Powered by" section previously used a `hast-powered-by`
> i18n key rendered via `hast-util-to-html`. This was replaced by `html-powered-by`
> (plain HTML string) with `v-html="$t('html-powered-by')"`, eliminating the need for
> `renderHast()` and the `useI18n()` script import.

##### 4.2.2.3 Event Delegation

Footer links use `data-link-img-props` and `data-qr-url` data attributes.
App.vue's delegated click handlers read these attributes and populate the
corresponding modal props.
