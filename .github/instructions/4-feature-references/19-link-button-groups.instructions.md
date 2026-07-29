---
description: >
  Link button groups: build-time pre-rendered inline button groups from simplified JSON configs
  (LinkButtonData), placeholder injection via data-role=link-button-group with data-group-id matching.
  Key differences from link cards: simplified config format (not full HAST), inline btn-group layout,
  primary button handling with automatic colored image transformation for visibility on btn-primary
  background.
  Use when: creating/modifying link-button-group JSON configs, the button-groups builder, or button injection logic.
applyTo: >
  build/builders/link-button-groups.ts;
  build/configs/link-button-groups/**;
  build/content-injection-plugin.ts
---

### 4.19 Link Button Groups

**Brief**: Link button groups are pre-rendered into static HTML at build time from simplified JSON configs (not full HAST). Unlike link cards (§4.5) which use HAST JSON for maximum flexibility, button groups use a purpose-built data structure (`LinkButtonData`) that the builder converts into HAST internally. For the JSON data format, see [§3.3.4](../3-project-structural-constraints/3-type-definitions.instructions.md#334-link-button-group-json-format-buildconfigslink-button-groupsjson). For how they are rendered and injected, see [§4.2.5](2-build-time-injection.instructions.md#425-link-button-group-injection).

**Key differences from Link Cards**:

| Aspect             | Link Cards (§4.5)              | Link Button Groups (§4.19)                                                                                               |
| ------------------ | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Config format      | Full HAST JSON                 | Simplified (`externalLink`, `linkHref`, `iconProps`)                                                                     |
| Layout             | Card grid (`#links` container) | Inline button group (`.btn-group`)                                                                                       |
| Injection target   | `#links` container             | `data-role="link-button-group"` placeholder                                                                              |
| QR codes           | Auto-appended to card titles   | Not shown (only external link confirmation modal)                                                                        |
| `primary` handling | N/A                            | Transforms display `<img>` to `colored` + `shlh-primary-color`; original `iconProps` preserved for `data-link-img-props` |

**Related Files**:

| File                                           | Role                                                   |
| ---------------------------------------------- | ------------------------------------------------------ |
| `build/builders/link-button-groups.ts`         | Build-time HTML generator from simplified JSON configs |
| `build/content-injection-plugin.ts`            | Vite plugin - calls builder, injects into placeholders |
| `build/configs/link-button-groups/{page}.json` | Button-group definitions (one per page)                |
| `build/types.ts`                               | `LinkButtonData`, `LinkButtonGroupData` interfaces     |

**Placeholder format** (in source HTML):

```html
<div data-role="link-button-group" data-group-id="artworks"></div>
```

The `data-group-id` must match a `groupId` in the page's JSON config. Both `data-role` and `data-group-id` are removed after injection.

**Interaction with Other Systems**:

- **i18n ([§4.3](3-internationalization-i18n.instructions.md))**: Each button's `data-bs-title` is derived from `iconProps.alt`; `data-i18n-tooltip` is derived from `iconProps.dataI18nAlt` if present.
- **Build-time Injection ([§4.2](2-build-time-injection.instructions.md))**: Buttons are pre-rendered at build time - no runtime DOM construction or JSON fetching. The `content-injection-plugin` finds `data-role="link-button-group"` placeholders and replaces their children with the generated HTML.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.instructions.md))**: External links (`externalLink: true`) carry `data-link-img-props` using the **original** `iconProps` (not the display-transformed version). Internal links carry `data-no-qr-code` instead.
- **Image Utilities ([§4.13](13-image-utilities.instructions.md))**: When `primary: true`, the display `<img>` is automatically set to use the `colored` feature (`dataImgFeature: "colored"`, `dataColorVar: "shlh-primary-color"`) for visibility on the `btn-primary` background. The original `dataSrcMask` is preserved if the source `iconProps` already uses the colored feature.
- **Page Transition ([§4.6](6-page-transitions.instructions.md))**: Links with `externalLink: false` get `internal-link` class for SPA navigation.
