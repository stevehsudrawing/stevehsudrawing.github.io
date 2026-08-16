---
description: >
  TypeScript type definitions: browser types (src/types/ - app.ts, hast.ts, globals.d.ts, css.d.ts)
  vs build-time types (build/types.ts). HAST node types (root/element/text/comment) and property
  naming conventions (className, camelCase data* attributes). Link-card JSON format (GroupData/CardData),
  Link-button-group JSON format (LinkButtonData/LinkButtonGroupData), and picture-list JSON format
  (DisplayPictureGroupData/DisplayPictureData).
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

| File               | Types                                                                                                                                                                                                                           | Purpose                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `app.ts`           | `Lang`, `ThemeChoice`, `StorageKey`, `AppEvent`, `ImgFeature`, `LanguageAwareImgSrcMap`, `ThemeAwareImgSrcMap`, `PictureSrcMap`, `ColoredImgProps`, `FeatureAwarePictureProps`, `DisplayPictureData`, `DisplayPictureGroupData` | Application-wide enums, string literals, image component props, and picture-list data                 |
| `hast.ts`          | `HastNode`, `HastProperties`                                                                                                                                                                                                    | Hypertext Abstract Syntax Tree node structures                                                        |
| `globals.d.ts`     | `Window` interface extensions                                                                                                                                                                                                   | Type declarations for `window.bootstrap`, `window.toHtml`, `window.htmlToImage`, `window.html2canvas` |
| `css.d.ts`         | `*.css` module declaration                                                                                                                                                                                                      | Allows TypeScript to resolve CSS imports                                                              |
| `vue-shims.d.ts`   | `.vue` module declaration                                                                                                                                                                                                       | Allows TypeScript to resolve `.vue` imports (`declare module "*.vue"`)                                |
| `vue-augment.d.ts` | `@vue/runtime-core` augmentation                                                                                                                                                                                                | Extends `ComponentCustomProperties` with global `$t()` type                                           |

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

| Type                  | Purpose                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- |
| `PageMetaEntry`       | Single page metadata entry (title, description, pagePath, robots, jsonLDType, tier)     |
| `PageMetaMap`         | `Record<string, PageMetaEntry>` - the shape of `PAGE_META` in `site-meta.ts`            |
| `PageTier`            | `'full' \| 'none'` - controls which head tags are used                                  |
| `JsonLDType`          | `'homepage' \| 'breadcrumb' \| 'none'` - determines JSON-LD structured data format      |
| `CardData`            | Link-card descriptor (`available`, `icon`, `title`, `description`)                      |
| `GroupData`           | Link-card group descriptor (`title`, `description`, `contents`)                         |
| `LinkButtonData`      | Link-button descriptor (`externalLink`, `linkHref`, `iconProps`, `primary?`, `sameAs?`) |
| `LinkButtonGroupData` | Link-button-group descriptor (`groupId`, `buttons`)                                     |

Build-time types may import from npm packages, Node.js APIs, and `src/types/`. They exist only at build time - never bundled into browser output.

#### 3.3.3 Link-card JSON Format (`src/configs/link-cards/*.json`)

Each page's link cards are defined as a JSON array of **Link Card Groups** (`GroupData[]`). Groups contain cards; cards contain HAST subtrees for icon, title, and description.

**Top-level: Link Card Group**

```json
{
    "title": { "type": "element", "tagName": "span", "properties": { "dataI18n": "text-artworks" }, "children": [...] },
    "description": { "type": "root", "children": [...] },
    "contents": [ /* array of Link Cards */ ]
}
```

- `title`: A HAST node (usually `<span>` with `dataI18n`) - rendered inside `<h2 class="title-link-group h4">` with hash/copy anchors.
- `description`: A HAST node (`null` if absent) - rendered inside `<p class="card-text">`.
- `contents`: Array of Link Cards.

**Link Card**

```json
{
  "available": true,
  "icon": {
    "type": "element",
    "tagName": "img",
    "properties": { "alt": "Pixiv", "src": "/images/webp/icons/pixiv.webp" },
    "children": []
  },
  "title": {
    "type": "element",
    "tagName": "a",
    "properties": { "href": "https://...", "className": ["external-link"] },
    "children": [
      {
        "type": "element",
        "tagName": "span",
        "children": [{ "type": "text", "value": "Pixiv" }]
      }
    ]
  },
  "description": {
    "type": "root",
    "children": [
      {
        "type": "element",
        "tagName": "span",
        "children": [{ "type": "text", "value": "UID: 70732361" }]
      }
    ]
  }
}
```

- `available`: Boolean. When not `true`, the card gets `opacity-75`.
- `icon`: A HAST `<img>` element (`null` if absent). Its `properties` are used as the card's icon props - injected into title/description links as `data-link-img-props`, and passed to the QR code modal for the centre icon.
- `title`: A HAST node - rendered inside `<span class="card-title h6">`. When it is a single `<a>`, the h6 gets `d-flex align-items-center justify-content-between` and a QR button is appended. Title links get both `data-link-img-props` and QR buttons.
- `description`: A HAST node (`null` if absent) - rendered inside `<p class="card-text">`. Links in descriptions get `data-link-img-props` but **no** QR buttons.

For how cards are rendered and injected, see §4.2.3 Link Card Injection in the [Build-time Injection](../4-feature-references/2-build-time-injection.instructions.md#423-link-card-injection) documentation.

#### 3.3.4 Link-button-group JSON Format (`src/configs/link-button-groups/*.json`)

Each page's link button groups are defined as a JSON array of **Link Button Groups** (`LinkButtonGroupData[]`). Unlike link cards, these use a simplified data format - the builder converts them into HAST.

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
  "externalLink": true,
  "linkHref": "https://www.pixiv.net/users/70732361",
  "primary": true,
  "iconProps": {
    "alt": "Pixiv",
    "src": "/images/webp/icons/pixiv.webp"
  }
}
```

- `externalLink`: Boolean. `true` -> `external-link` class + `data-link-img-props`; `false` -> `internal-link` class + `data-no-qr-code`.
- `linkHref`: The link URL.
- `primary`: Optional boolean placeholder (currently unused - all buttons use `btn-outline-secondary`).
- `iconProps`: `HastProperties` for the `<img>` child. `alt` is also used to derive `data-bs-title`; `dataI18nAlt` is used to derive `data-i18n-tooltip`.

For how button groups are rendered and injected, see §4.2.5 Link Button Group Injection in the [Build-time Injection](../4-feature-references/2-build-time-injection.instructions.md#425-link-button-group-injection) documentation.

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
  "qrCodeIconPictureProps": {
    "src": "/images/webp/icons/sticker-collection-series-1-vol-1.webp"
  },
  "relatedLink": "/artworks-and-videos.html#sticker-collections"
}
```

- `id`: Also the i18n alt-key suffix (`alt` falls back to `t("text-" + id)`)
  and the lightbox deep-link target (`?preview=<id>`).
- `pictureProps`: `Omit<FeatureAwarePictureProps, "alt">` — `alt` is optional
  (falls back to `t("text-" + id)`), width/height omitted (masonry CSS), and
  `loading` defaults to lazy.
- `qrCodeIconPictureProps` / `qrCodeIconColoredProps`: QR share-card centre
  overlay icon — set at most one (picture preferred; colored only when no
  picture variant). MUST never reference the poster itself.
- `relatedLink`: Optional internal link back to a related section on another
  page (e.g. `/artworks-and-videos.html#sticker-collections`).

For how picture groups are rendered, see
[§4.2.15 Picture List](../4-feature-references/02-ui-components/15-picture-list.instructions.md).
