---
description: >
  QR Code: QRCodeModal.vue (qrcode canvas generation, centre overlay icon, PNG export via
  html-to-image with html2canvas fallback, Web Share API, clipboard copy).  data-qr-url and
  data-qr-icon attributes for App.vue event delegation.
  Use when: modifying QR code generation, export/fallback logic, or share-card layout.
applyTo: >
  src/components/modals/QRCodeModal.vue
---

#### 4.3.2 QR Code & Export

##### 4.3.2.1 Architecture

```
App.vue (click delegation)
  └─ onQRTrigger(e) -> reads data-qr-url, data-qr-icon -> qrCodeModalRef.show()

QRCodeModal.vue
  ├─ Props: url, imgProperties?, hideOpenLink?
  ├─ State: visible, qrCanvas, center icon (useImgDisplayProps), computed helpers
  ├─ Actions: generateQR(), renderShareCardBlob(), downloadPNG(), shareImage(), copyImage()
  └─ Expose: show(), hide()
```

##### 4.3.2.2 QR Code Generation

- Library: `qrcode` (npm), `errorCorrectionLevel: "Q"` (25%)
- Colors from `getComputedStyle`: `--bs-body-color` (dark) / `--bs-body-bg` (light)
- Re-generates on theme change (`watch(effectiveTheme)`)

##### 4.3.2.3 PNG Export (Two-Tier Fallback)

1. **html-to-image `toPng()`** -- primary (canvas via SVG foreignObject)
2. **html2canvas** -- fallback (mobile / no foreignObject)

##### 4.3.2.4 Footer Buttons

| Button    | Action                                                              |
| --------- | ------------------------------------------------------------------- |
| Open Link | `emit("open-link")` -> App.vue switches to ExternalLinkConfirmModal |
| Share     | `navigator.share({ files: [qr-code.png] })`                         |
| Download  | Blob -> `<a download>`                                              |
| Close     | Hide modal                                                          |

##### 4.3.2.5 data-qr-url / data-qr-icon Attributes

```html
<a
  data-qr-url="https://example.com"
  data-qr-icon='{"alt":"...","src":"...","dataImgFeature":"colored",...}'
  data-no-open-link
></a>
```
