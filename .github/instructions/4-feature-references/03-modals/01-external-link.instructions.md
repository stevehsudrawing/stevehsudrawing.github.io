---
description: >
  External Link Confirmation: ExternalLinkConfirmModal.vue (props: url,
  pictureProps, coloredProps, hideQRButton; emits: navigate, show-qr).
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
  ├─ Props: url, pictureProps?, coloredProps?, hideQRButton?
  ├─ State: visible, openInNewTab
  ├─ Actions: confirm(), showQR()
  └─ Expose: show(), hide()
```

##### 4.3.1.2 Props

| Prop           | Type                                | Purpose                                |
| -------------- | ----------------------------------- | -------------------------------------- |
| `url`          | `string`                            | External URL                           |
| `pictureProps` | `FeatureAwarePictureProps \| null?` | Icon props for non-colored icon        |
| `coloredProps` | `ColoredImgProps \| null?`          | Icon props for colored (CSS mask) icon |
| `hideQRButton` | `boolean?`                          | Hide "Show QR Code" button             |

##### 4.3.1.3 Emits

| Event      | Payload                             | When                       |
| ---------- | ----------------------------------- | -------------------------- |
| `navigate` | `(url, openInNewTab)`               | User clicks "Open"         |
| `show-qr`  | `(url, pictureProps, coloredProps)` | User clicks "Show QR Code" |

##### 4.3.1.4 Typed Props Passthrough

Icons are passed as typed `pictureProps` / `coloredProps` through the
`TypeAwareLink` → `App.vue` provide/inject pipeline. The modal renders
`<ColoredImg>` when `coloredProps` is set, `<FeatureAwarePicture>` when
`pictureProps` is set. No HAST round-trip or `useImgDisplayProps` needed.
