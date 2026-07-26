---
description: >
  QR code and export: branded QR code share card generation via qrcode library, PNG download via
  html-to-image with html2canvas fallback for mobile, centre overlay icon rendered from HAST
  imgProperties, modal footer buttons (Open Link/Share/Download/Close), Web Share API integration.
  Use when: modifying qr-code.ts, qr-code.css, or QR code modal behavior.
applyTo: >
  src/features/qr-code.ts;
  src/stylesheets/qr-code.css;
  build/page-components/modals.html
---

### 4.10 QR Code & Export

**Brief**: Generates a branded QR code share card and allows downloading it as a PNG image. The modal also provides an "Open Link" button that switches to the external link confirmation modal for cross-navigation.

**Related Files**:

| File                          | Role                                                |
| ----------------------------- | --------------------------------------------------- |
| `src/features/qr-code.ts`     | QR code generation, share card assembly, PNG export |
| `src/stylesheets/qr-code.css` | Share card layout styles                            |
| `page-components/modals.html` | QR code modal HTML (shared with other modals)       |

**How It Works**:

- QR Code is generated dynamically via QRCode.js inside a branded share card (logo + site name).
- Can be downloaded as a PNG image via `html-to-image`, with `html2canvas` fallback for mobile browsers.
- A centre overlay icon is rendered from `imgProperties` (hast-format properties; see [§4.5.1.2](5-link-cards.instructions.md#4512-property-naming-hast-convention)). Custom icons replace the default link icon.
- **Modal footer** (left to right): [Open Link] [Share] [Download] (me-auto) [Close].
  - **Open Link** (`bi-box-arrow-up-right`, icon-only): Switches to the external link confirmation modal ([§4.17](17-external-link-confirmation.instructions.md#417-external-link-confirmation)) via `hidden.bs.modal` transition. Hidden for internal links (`isInternalPage`). Has `aria-label` + tooltip (i18n key `text-open`).
  - **Share** (`bi-share-fill`, icon-only): Uses the native Web Share API when available; hidden otherwise. Has `aria-label` + tooltip (i18n key `text-share`).
  - **Download** (`bi-download`, icon-only): Triggers a direct PNG blob download. Has `aria-label` + tooltip (i18n key `text-download`).
- The `imgProperties` and `linkUrl` are stored on the modal DOM element (`_qrUrl`, `_qrIconProps`) so the "Open Link" button can pass them back to the confirmation modal.

**Key Functions**:

- `showQRCodeModal(linkUrl, imgProperties, hideOpenLink)` - Generates the QR code, renders the centre icon, and shows the modal. The optional `hideOpenLink` parameter suppresses the "Open Link" button.
- `initQRCodeDelegation()` - Sets up delegated click listener for `[data-qr-url]` triggers. Reads the `data-no-open-link` attribute to suppress the "Open Link" button.
