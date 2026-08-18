---
description: >
  TypeScript type definitions: browser types (src/types/ - app.ts, hast.ts, globals.d.ts, css.d.ts)
  vs build-time types (build/types.ts). HAST node types (root/element/text/comment) and property
  naming conventions (className, camelCase data* attributes). Link-card JSON format (LinkCardGroupData/
  LinkCardData), Link-button-group JSON format (LinkButtonData/LinkButtonGroupData), and picture-list
  JSON format (DisplayPictureGroupData/DisplayPictureData).
  Use when: defining new types, modifying HAST structures, or creating link-card / link-button-group /
  picture-list configs.
applyTo: >
  src/types/**;
  build/types.ts;
  src/configs/link-cards/**;
  src/configs/link-button-groups/**;
  src/configs/picture-list/**
---

### 3.3 Type Definitions

TypeScript type definitions are split into two groups: browser types (used by `src/`) and build-time types (used by `build/` and `vite.config.ts`).

#### 3.3.1 Browser Types (`src/types/`)

Located in `src/types/` and bundled into the browser output. Type-checked by the root `tsconfig.json` (targets `DOM` lib).

| File               | Types                                                                                                                                                                                                                                                                                                                                                                                                           | Purpose                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`           | `Lang`, `ThemeChoice`, `StorageKey`, `AppEvent`, `ImgFeature`, `LanguageAwareImgSrcMap`, `ThemeAwareImgSrcMap`, `PictureSrcMap`, `ColoredImgProps`, `FeatureAwarePictureProps`, `TypeAwareImageProps`, `TypeAwareLinkProps`, `LinkCardData`, `LinkCardGroupData`, `LinkButtonData`, `LinkButtonGroupData`, `DisplayPictureData`, `DisplayPictureGroupData`, `ExternalLinkConfirmModalProps`, `QRCodeModalProps` | Application-wide enums, string literals, image/link component props, link-card / link-button / picture-list data, and modal-stack props |
| `hast.ts`          | `HastNode`, `HastProperties`                                                                                                                                                                                                                                                                                                                                                                                    | Hypertext Abstract Syntax Tree node structures                                                                                          |
| `globals.d.ts`     | `Window` interface extensions                                                                                                                                                                                                                                                                                                                                                                                   | Type declarations for `window.bootstrap`, `window.toHtml`, `window.htmlToImage`, `window.html2canvas`                                   |
| `css.d.ts`         | `*.css` module declaration                                                                                                                                                                                                                                                                                                                                                                                      | Allows TypeScript to resolve CSS imports                                                                                                |
| `vue-shims.d.ts`   | `.vue` module declaration                                                                                                                                                                                                                                                                                                                                                                                       | Allows TypeScript to resolve `.vue` imports (`declare module "*.vue"`)                                                                  |
| `vue-augment.d.ts` | `@vue/runtime-core` augmentation                                                                                                                                                                                                                                                                                                                                                                                | Extends `ComponentCustomProperties` with global `$t()` type                                                                             |

**Layered constraints**: `types/` may import from npm packages and browser APIs, but **must NOT** import from `core/`, `ui/`, or `features/`.

**HAST Node Types** (defined in `hast.ts`):

| Node type | JSON shape                                                                        | Rendered as                       |
| --------- | --------------------------------------------------------------------------------- | --------------------------------- |
| `root`    | `{ "type": "root", "children": [...] }`                                           | Fragment wrapper (no DOM element) |
| `element` | `{ "type": "element", "tagName": "...", "properties": {...}, "children": [...] }` | HTML element                      |
| `text`    | `{ "type": "text", "value": "..." }`                                              | Text node                         |
| `comment` | `{ "type": "comment", "value": "..." }`                                           | HTML comment                      |

**HAST Property Naming**: HAST uses `className` (string or array) instead of
`class`, and `data*` attributes are camelCase (e.g. `dataI18n` -> `data-i18n`).
`hast-util-to-html` handles kebab-case conversion automatically.

```json
{
  "className": ["external-link"],
  "href": "https://example.com",
  "dataI18n": "text-foo",
  "dataImgFeature": "colored"
}
```

-> `<a class="external-link" href="https://example.com" data-i18n="text-foo" data-img-feature="colored">`

**Image rendering**: when `dataImgFeature` contains `"colored"`, the HAST → Vue
pipeline routes to `ColoredImg`; otherwise `FeatureAwarePicture`. See
[§4.2.4](../4-feature-references/02-ui-components/04-feature-aware-img.instructions.md).

#### 3.3.2 Build-time Types (`build/types.ts`)

Located in `build/types.ts` and used by Vite plugins and build scripts. Type-checked by `tsconfig.build.json` (targets `Node` lib via `@types/node`).

| Type            | Purpose                                                                             |
| --------------- | ----------------------------------------------------------------------------------- |
| `PageMetaEntry` | Single page metadata entry (title, description, pagePath, robots, jsonLDType, tier) |
| `PageMetaMap`   | `Record<string, PageMetaEntry>` - the shape of `PAGE_META` in `site-meta.ts`        |
| `PageTier`      | `'full' \| 'none'` - controls which head tags are used                              |
| `JsonLDType`    | `'homepage' \| 'breadcrumb' \| 'none'` - determines JSON-LD structured data format  |

> Link-card / link-button config types (`LinkCardData`, `LinkCardGroupData`, `LinkButtonData`,
> `LinkButtonGroupData`, `TypeAwareImageProps`, `TypeAwareLinkProps`) are defined in
> `src/types/app.ts` and shared by the Vue components and the build-time builders.

Build-time types may import from npm packages, Node.js APIs, and `src/types/`. They exist only at build time - never bundled into browser output.

#### 3.3.3 Link-card JSON Format (`src/configs/link-cards/*.json`)

Each page's link cards are defined as a JSON array of **Link Card Groups**
(`LinkCardGroupData[]`). Groups contain cards; cards use typed props instead of
HAST for the icon and title (only `description` keeps its HAST subtree). All
`id` fields are i18n key suffixes resolved via `t("text-" + id)`.

**Top-level: Link Card Group**

```json
{
  "id": "artworks",
  "description": { "type": "element", "tagName": "span", "properties": { "dataI18n": "text-artworks-description" }, "children": [...] },
  "contents": [ /* array of Link Cards */ ]
}
```

- `id`: i18n key suffix for the group heading (`t("text-" + id)`) and the stable
  language-independent anchor id (`id="<id>"`).
- `description`: A HAST node (`null`/omitted if absent) - rendered inside
  `<p class="card-text">`.
- `contents`: Array of Link Cards.

**Link Card**

```json
{
  "id": "pixiv",
  "icon": {
    "type": "picture",
    "imgProps": { "src": "/images/webp/icons/pixiv.webp" }
  },
  "titleLink": {
    "type": "external",
    "href": "https://www.pixiv.net/users/70732361"
  },
  "description": { "type": "root", "children": [...] }
}
```

- `id`: i18n key suffix for the title text and icon alt (`t("text-" + id)`).
- `available`: Omit (default `true`) for a normal card, or set `false` for an
  unavailable card. `available: false` cards are dimmed (`opacity-75`) and render
  their title as plain text (no `titleLink`).
- `icon`: A `TypeAwareImageProps` (`null`/omitted if absent) - either
  `{ "type": "picture", "imgProps": FeatureAwarePictureProps }` or
  `{ "type": "colored-img", "imgProps": ColoredImgProps }`. Rendered via
  `TypeAwareImage`. `alt` is optional - falls back to `t("text-" + id)`.
- `titleLink`: A `TypeAwareLinkProps` (`{ type, href }`) - the card title link.
  External cards get a QR button.
- `description`: A HAST node (`null`/omitted if absent) - rendered inside
  `<p class="card-text">`.

#### 3.3.4 Link-button-group JSON Format (`src/configs/link-button-groups/*.json`)

Each page's link button groups are defined as a JSON array of **Link Button
Groups** (`LinkButtonGroupData[]`).

**Top-level: Link Button Group**

```json
{
  "groupId": "artworks",
  "buttons": [/* array of Link Buttons */]
}
```

- `groupId`: String identifier matching the `data-group-id` attribute of the placeholder in HTML.
- `buttons`: Array of Link Buttons.

**Link Button**

```json
{
  "id": "pixiv",
  "link": {
    "type": "external",
    "href": "https://www.pixiv.net/users/70732361"
  },
  "icon": {
    "type": "picture",
    "imgProps": { "src": "/images/webp/icons/pixiv.webp" }
  },
  "primary": true,
  "sameAs": true
}
```

- `id`: i18n key suffix for the tooltip and icon alt (`t("text-" + id)`).
- `link`: A `TypeAwareLinkProps` (`{ type, href }`).
- `icon`: A `TypeAwareImageProps` - rendered via `TypeAwareImage`.
- `primary`: Optional - `true` gives the button `btn-primary` styling (the icon
  is displayed as a colored mask tinted with `shlh-primary-color`).
- `sameAs`: Optional - when the link is external and `sameAs` is `true`, the URL
  is included in the JSON-LD `sameAs` profile list (see `head-tags-plugin.ts`).

#### 3.3.5 Picture-list JSON Format (`src/configs/picture-list/*.json`)

Each page's picture list (currently the Gallery page) is a JSON array of
**Picture Groups** (`DisplayPictureGroupData[]`).

**Top-level: Picture Group**

```json
{
  "id": "sticker-collections",
  "description": {
    "type": "element",
    "tagName": "span",
    "properties": {
      "dataI18n": "text-sticker-collections-display-description"
    },
    "children": [{ "type": "text", "value": "..." }]
  },
  "contents": [/* array of Pictures */]
}
```

- `id`: Also the i18n key suffix (`t("text-" + id)`) for the `SectionHeading`
  title and the stable anchor id. Naming: individual series use **singular**
  (`sticker-collection-series-1-vol-1`), the collective group uses **plural**
  (`sticker-collections`).
- `description`: A HAST node (`null` if absent) — rendered exactly like
  `LinkCardGroup` (`v-html` + `resolveI18nInHtml` + `toHtml`).
- `contents`: Array of Pictures.

**Picture**

```json
{
  "id": "sticker-collection-series-1-vol-1",
  "pictureProps": {
    "srcMap": {
      "webp": { "light": { "en": "...", "zh-Hans": "..." } },
      "avif": { "light": { "en": "...", "zh-Hans": "..." } }
    },
    "feature": ["follow-language"]
  },
  "qrCodeIcon": {
    "type": "picture",
    "imgProps": {
      "src": "/images/webp/icons/sticker-collection-series-1-vol-1.webp"
    }
  },
  "relatedLink": {
    "type": "internal",
    "href": "/artworks-and-videos.html#sticker-collections"
  }
}
```

- `id`: Also the i18n alt-key suffix (`alt` falls back to `t("text-" + id)`)
  and the lightbox deep-link target (`?preview=<id>`).
- `pictureProps`: `FeatureAwarePictureProps` — `alt` is optional (falls back to
  `t("text-" + id)`), width/height omitted (masonry CSS), and `loading`
  defaults to lazy.
- `qrCodeIcon`: Optional `TypeAwareImageProps` QR share-card centre overlay
  icon (picture or colored). MUST never reference the poster itself.
- `relatedLink`: Optional `TypeAwareLinkProps` link back to a related section
  on another page (e.g. internal → `/artworks-and-videos.html#sticker-collections`).

For how picture groups are rendered, see
[§4.2.15 Picture List](../4-feature-references/02-ui-components/15-picture-list.instructions.md).
