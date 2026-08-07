---
description: >
  Modal helpers: useCrossModalNavigation() composable (shared state for
  ExternalLink <-> QRCode modal handoffs) and useModalFocus() composable
  (keyboard-aware auto-focus when a BModal opens via Tab navigation).
  Use when: modifying modal-to-modal flow or keyboard accessibility for modals.
applyTo: >
  src/composables/useCrossModalNavigation.ts;
  src/composables/useModalFocus.ts;
  src/components/modals/ExternalLinkConfirmModal.vue;
  src/components/modals/QRCodeModal.vue;
  src/components/modals/SettingsModal.vue;
  src/components/modals/ResetWarningModal.vue
---

#### 4.1.7 Modal Helpers

##### 4.1.7.1 useCrossModalNavigation()

Manages the reactive props flowing between `ExternalLinkConfirmModal` and
`QRCodeModal`, plus the navigation helpers that switch from one modal to
the other.

```
App.vue
  └── useCrossModalNavigation(qrCodeModalRef, extLinkModalRef)
        │
        ├── State: extLinkUrl, extLinkImgProps, extLinkHideQR,
        │          qrUrl, qrImgProps, qrHideOpenLink
        │
        └── Actions: onExtLinkNavigate  (open URL in same/new tab)
                     onExtLinkShowQR    (hide ExtLink modal -> show QR modal)
                     onQROpenLink       (hide QR modal -> show ExtLink modal)
```

The modal refs (`qrCodeModalRef`, `extLinkModalRef`) are passed as
parameters so the composable can call `.show()` on each. The reactive
state is returned so App.vue can bind it to the modal components'
props.

##### 4.1.7.2 useModalFocus()

Keyboard-aware auto-focus for BModal `@shown` events:

```ts
const langSelectRef = ref<HTMLElement | null>(null);
const { onShown } = useModalFocus(langSelectRef);
// <BModal @shown="onShown" ...>
```

Only transfers focus when `<html>` has `.user-input-keyboard` (the user
was last using Tab/arrow keys). Mouse and touch users are unaffected --
BModal's default focus management works as normal.

| Modal                      | Focus Target        |
| -------------------------- | ------------------- |
| `SettingsModal`            | Language `<select>` |
| `ExternalLinkConfirmModal` | "Open" button       |
| `ResetWarningModal`        | "Cancel" button     |
| `QRCodeModal`              | (no intervention)   |
