---
description: >
  External link confirmation: intercepts .external-link clicks (with modifier key bypass), shows
  confirmation modal with link icon (from data-link-img-props JSON attribute using HAST property
  conventions), target URL display, Open in new tab toggle synced with settings localStorage, Show
  QR Code button switching to QR modal, Open button navigating via window.open or location.href.
  Use when: modifying external-link-confirmation.ts, external-link-confirmation.css, or external link behavior.
applyTo: >
  src/features/external-link-confirmation.ts;
  src/stylesheets/external-link-confirmation.css;
  build/page-components/modals.html
---

### 4.17 External Link Confirmation

**Brief**: Intercepts clicks on external links (`.external-link`) and shows a confirmation modal before navigating away from the site. Displays an optional link icon, allows switching to the QR code modal, and lets the user choose whether to open the link in a new tab.

**Related Files**:

| File                                         | Role                                               |
|----------------------------------------------|----------------------------------------------------|
| `src/features/external-link-confirmation.ts` | Link interception, modal display, navigation logic |
| `stylesheets/external-link-confirmation.css` | Modal URL display styling                          |
| `page-components/modals.html`                | Confirmation modal HTML (shared with other modals) |

**How It Works**:

```
User clicks a.external-link
  ↓ (preventDefault)
shouldConfirmExternalLink(link) checks:
  - Must have .external-link class
  - Must have a valid href (not #, javascript:, mailto:, tel:)
  - Must not have download or onclick attributes
  - Must not be an internal page (isInternalPage check)
  ↓ Passes all checks
Read data-link-img-props attribute (if present) -> JSON.parse -> imgProperties
  ↓
Show confirmation modal:
  - Displays the link icon (if imgProperties provided)
  - Displays the target URL
  - "Open in new tab" toggle (synced with localStorage openExternalLinksInNewTab)
  - [Show QR Code] button -> switches to QR code modal (via hidden.bs.modal)
  - [Open] button -> navigateToExternalUrl()
  - [Close] button / x / backdrop -> dismiss
  ↓ User clicks [Open]
navigateToExternalUrl():
  - If toggle is ON -> window.open(url, '_blank', 'noopener,noreferrer')
  - If toggle is OFF -> window.location.href = url
```

- Modifier key clicks (Ctrl/Cmd/Shift/Alt) bypass the confirmation and let the browser handle the link normally.
- The "Open in new tab" toggle shares the same `localStorage` key (`openExternalLinksInNewTab`) with the settings modal ([§4.8](8-settings-preferences.md#48-settings--preferences)). Changes in either location are immediately reflected in the other.
- The **link icon** is rendered from `imgProperties` (hast-format; see [§4.5.1.2](5-link-cards.md#4512-property-naming-hast-convention)). Coloured icons (`dataImgFeature: "colored"`) are processed via `applyColoredImage`.
- The **"Show QR Code"** button (`bi-qr-code`, icon-only) switches to the QR code modal via `hidden.bs.modal` transition, passing both the URL and `imgProperties`. Has `aria-label` + tooltip (i18n key `text-show-qr-code`).
- The `url` and `imgProperties` are stored on the modal DOM element (`_confirmUrl`, `_confirmIconProps`) so the "Show QR Code" button can pass them to the QR modal, and the QR modal's "Open Link" button can pass them back.

#### 4.17.1 `data-link-img-props` Attribute

External links (`a.external-link`) may carry a `data-link-img-props` attribute containing a JSON-serialized HAST-format icon properties object. When present, the confirmation modal displays the icon next to the URL.

```html
<a href="https://pixiv.net/..."
   class="external-link"
   data-link-img-props='{"alt":"Pixiv","src":"/images/webp/icons/pixiv.webp"}'>
    Pixiv
</a>
```

- The value is a JSON string using HAST property conventions (`className`, `dataImgFeature`, `dataSrcMask`, `dataColorVar`, `dataI18nAlt` — see [§4.5.1.2](5-link-cards.md#4512-property-naming-hast-convention)).
- Link cards automatically inject this attribute on title and description links (using the card's icon properties) during `buildCardItem`.
- Static HTML links can carry it manually; use single quotes for the attribute value to avoid escaping double-quote JSON.
- `handleExternalLinkClick` reads the attribute via `JSON.parse` and passes the result as the second argument to `showExternalLinkConfirmation`.

**Key Functions**:

- `shouldConfirmExternalLink(link)` - Determines whether a clicked link should trigger the confirmation modal.
- `showExternalLinkConfirmation(url, imgProperties, hideQRButton)` - Populates and displays the confirmation modal. The optional `hideQRButton` parameter suppresses the "Show QR Code" button.
- `navigateToExternalUrl(url)` - Performs the actual navigation based on the toggle state.
- `handleExternalLinkClick(e)` - Delegated click handler that intercepts `.external-link` clicks. Reads `data-link-img-props` and `data-no-qr-code` (to suppress QR button) and passes them to `showExternalLinkConfirmation`.
- `handleExternalLinkConfirm()` - Handles the [Open] button click.
- `handleExternalLinkShowQR()` - Handles the [Show QR Code] button click. Hides the confirmation modal, then calls `showQRCodeModal` after the hide transition.
- `handleExternalLinkToggleChange()` - Persists toggle changes to localStorage and applies the target behavior.
- `initExternalLinkConfirmation()` - Sets up delegated event listeners on `document`. Called once during page initialization in `main.ts`.

**Data Flow**:

| Mechanism      | Key                         | Purpose                                                                                      |
|----------------|-----------------------------|----------------------------------------------------------------------------------------------|
| `localStorage` | `openExternalLinksInNewTab` | Shared preference with settings modal ([§4.8](8-settings-preferences.md#48-settings--preferences)) for new-tab toggle |
| DOM attribute  | `data-link-img-props`       | JSON-serialized HAST icon properties for the confirmation modal icon                         |

**Interaction with Other Systems**:

- **Page Transition ([§4.6](6-page-transitions.md#46-page-transitions))**: The confirmation system only intercepts `.external-link` links. Internal links continue to be handled by `page-transition.ts` via `shouldInterceptLink()`.
- **QR Code ([§4.10](10-qr-code-export.md#410-qr-code--export))**: The [Show QR Code] button and the QR modal's [Open Link] button form a cross-navigation pair. Both preserve `imgProperties` across the round-trip via DOM element storage.
- **Settings ([§4.8](8-settings-preferences.md#48-settings--preferences))**: The new-tab toggle in the confirmation modal and the one in the settings modal share the same `localStorage` key. The `isExternalLinkNewTabEnabled()` / `setExternalLinkNewTabPreference()` / `applyAllExternalLinkTargetBehavior()` functions from `settings.ts` are called by the confirmation module.
- **Link Cards ([§4.5](5-link-cards.md#45-link-cards))**: `buildCardItem` injects `data-link-img-props` on all title and description links within a card, using the card's icon properties.
- **Image Utilities ([§4.13](13-image-utilities.md#413-image-utilities))**: Coloured icons in the confirmation modal are processed via `applyColoredImage`.
- **Utilities ([§4.15](15-utilities.md#415-utilities))**: `isInternalPage()` (in `utils.ts`) is used to avoid showing the confirmation for links that point to internal pages.
- **Build-time Injection ([§4.2](2-build-time-injection.md#42-build-time-injection))**: The modal HTML is part of `modals.html`, pre-injected into pages at build time by the content-injection-plugin.


