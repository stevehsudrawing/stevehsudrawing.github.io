---
description: >
  Link cards: build-time pre-rendered card groups from HAST JSON configs. Card structure
  (icon/title/description), group layout with hash/copy anchors, QR code integration on external
  links, external link confirmation integration via data-link-img-props, build-time injection
  into #links container.
  Use when: creating/modifying link-card JSON configs, the link-cards builder, or card-related injection logic.
applyTo: >
  build/builders/link-cards.ts;
  build/configs/link-cards/**;
  build/content-injection-plugin.ts
---

### 4.5 Link Cards

**Brief**: Link-card groups are pre-rendered into static HTML at build time from HAST-format JSON configs. For the JSON data format (node types, property naming, group/card structure), see [§3.3](../3-project-structural-constraints/3-type-definitions.md#333-link-card-json-format-buildconfigslink-cardsjson). For how cards are rendered and injected into pages, see [§4.2.3](2-build-time-injection.md#423-link-card-injection).

**Related Files**:

| File                                    | Role                                                      |
|-----------------------------------------|-----------------------------------------------------------|
| `build/builders/link-cards.ts`          | Build-time HTML generator from HAST JSON configs          |
| `build/content-injection-plugin.ts`     | Vite plugin that injects pre-rendered cards into `#links` |
| `build/configs/link-cards/{page-name}.json`  | Link-card group definitions for each page            |
| `src/core/accessibility.ts`             | `initHashChangeScroll()` for hash-based navigation        |

**Interaction with Other Systems**:

- **i18n ([§4.3](3-internationalization-i18n.md))**: HAST properties use camelCase `dataI18n` / `dataI18nHtml` / `dataI18nAlt`. `toHtml()` converts them to kebab-case HTML attributes.
- **QR Code ([§4.10](10-qr-code-export.md))**: External links in card titles get QR-code buttons. The card's icon properties are passed to the QR code modal.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.md))**: Card links carry `data-link-img-props` (derived from the card's icon properties) for the confirmation modal icon.
- **Build-time Injection ([§4.2](2-build-time-injection.md))**: Cards are pre-rendered at build time — no runtime DOM construction or JSON fetching.
- **Image Utilities ([§4.13](13-image-utilities.md#413-image-utilities))**: Card icons use `dataImgFeature` (`"colored"` or `"follow-theme"`) — see [§4.13.1](13-image-utilities.md#4131-data-img-feature-attribute). `setElementAttributes` converts camelCase to kebab-case.
- **Utilities ([§4.15](15-utilities.md#415-utilities))**: Uses `extractPageName()` to resolve the JSON config path and `toDashCase()` / `extractPlainText()` for group title IDs.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.md#417-external-link-confirmation))**: Links with `className: ["external-link"]` trigger the confirmation modal. Card title and description links automatically receive `data-link-img-props` (using the card's icon properties) so the confirmation modal can display the icon.
- **Page Transition ([§4.6](6-page-transitions.md#46-page-transitions))**: Links with `className: ["internal-link"]` trigger SPA navigation.


