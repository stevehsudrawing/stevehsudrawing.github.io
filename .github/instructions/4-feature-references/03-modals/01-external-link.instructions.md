---
description: >
  External Link Confirmation: ExternalLinkConfirmModal.vue (props: url,
  icon, hideQR; emits: navigate, show-qr).
  Typed props passthrough via TypeAwareLink / App.vue.
  Use when: modifying external link behavior, confirmation modal UI, or link interception.
applyTo: >
  src/components/modals/ExternalLinkConfirmModal.vue
---

#### 4.3.1 External Link Confirmation

##### 4.3.1.1 Architecture

```
App.vue (provide/inject pipeline)
  └─ OPEN_EXTERNAL_LINK_KEY → TypeAwareLink calls openExternalLink()

ExternalLinkConfirmModal.vue
  ├─ Props: url, icon, hideQR
  ├─ State: visible, openInNewTab
  ├─ Actions: confirm(), showQR()
  └─ Expose: show(), hide()
```

##### 4.3.1.2 Props

| Prop     | Type                          | Purpose                            |
| -------- | ----------------------------- | ---------------------------------- |
| `url`    | `string`                      | External URL                       |
| `icon`   | `TypeAwareImageProps \| null` | Optional icon (picture or colored) |
| `hideQR` | `boolean`                     | Hide "Show QR Code" button         |

##### 4.3.1.3 Emits

| Event      | Payload               | When                       |
| ---------- | --------------------- | -------------------------- |
| `navigate` | `(url, openInNewTab)` | User clicks "Open"         |
| `show-qr`  | `(url, icon)`         | User clicks "Show QR Code" |

##### 4.3.1.4 Typed Props Passthrough

The icon is passed as typed `icon: TypeAwareImageProps | null` through the
`TypeAwareLink` → `App.vue` provide/inject pipeline. The modal renders it via
`TypeAwareImage` (with the resolved alt injected). No HAST round-trip needed.
