---
description: >
  External Link Confirmation: ExternalLinkConfirmModal.vue (props: url, imgProperties,
  hideQRButton; emits: navigate, show-qr).  data-link-img-props JSON attribute for icon.
  Use when: modifying external link behavior, confirmation modal UI, or link interception.
applyTo: >
  src/components/modals/ExternalLinkConfirmModal.vue
---

#### 4.3.1 External Link Confirmation

##### 4.3.1.1 Architecture

```
App.vue (click delegation)
  └─ onExternalLinkClick(e)
       └─ reads: href, data-link-img-props, data-no-qr-code
       └─ calls: extLinkModalRef.value?.show()

ExternalLinkConfirmModal.vue
  ├─ Props: url, imgProperties?, hideQRButton?
  ├─ State: visible, openInNewTab, icon (useImgDisplayProps)
  ├─ Actions: confirm(), showQR(), copyUrl()
  └─ Expose: show(), hide()
```

##### 4.3.1.2 Props

| Prop            | Type                       | Purpose                     |
| --------------- | -------------------------- | --------------------------- |
| `url`           | `string`                   | External URL                |
| `imgProperties` | `Record<string, unknown>?` | HAST-format icon properties |
| `hideQRButton`  | `boolean?`                 | Hide "Show QR Code" button  |

##### 4.3.1.3 Emits

| Event      | Payload                | When                       |
| ---------- | ---------------------- | -------------------------- |
| `navigate` | `(url, openInNewTab)`  | User clicks "Open"         |
| `show-qr`  | `(url, imgProperties)` | User clicks "Show QR Code" |

##### 4.3.1.4 data-link-img-props Attribute

```html
<a
  class="external-link"
  href="https://example.com"
  data-link-img-props='{"alt":"...","src":"/images/...","dataImgFeature":"colored",...}'
></a>
```

Uses HAST camelCase conventions. Add `data-no-qr-code` to hide QR button.
