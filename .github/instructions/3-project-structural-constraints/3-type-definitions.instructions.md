---
description: >
  TypeScript type definitions: browser types (src/types/ - app.ts, hast.ts, globals.d.ts, css.d.ts)
  vs build-time types (build/types.ts). HAST node types (root/element/text/comment) and property
  naming conventions (className, camelCase data* attributes). Link-card JSON format (GroupData/CardData)
  and Link-button-group JSON format (LinkButtonData/LinkButtonGroupData).
  Use when: defining new types, modifying HAST structures, or creating link-card/link-button-group configs.
applyTo: >
  src/types/**;
  build/types.ts;
  build/configs/link-cards/**;
  build/configs/link-button-groups/**
---

### 3.3 Type Definitions

TypeScript type definitions are split into two groups: browser types (used by `src/`) and build-time types (used by `build/` and `vite.config.ts`).

#### 3.3.1 Browser Types (`src/types/`)

Located in `src/types/` and bundled into the browser output. Type-checked by the root `tsconfig.json` (targets `DOM` lib).

| File           | Types                                           | Purpose                                                                                                                                |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `app.ts`       | `Lang`, `ThemeChoice`, `StorageKey`, `AppEvent` | Application-wide enums and string literal types                                                                                        |
| `hast.ts`      | `HastNode`, `HastProperties`                    | Hypertext Abstract Syntax Tree node structures - used by `utils.ts` for `setElementAttributes`, and by `qr-code.ts` for icon rendering |
| `globals.d.ts` | `Window` interface extensions                   | Type declarations for `window.bootstrap`, `window.toHtml`, `window.htmlToImage`, `window.html2canvas`                                  |
| `css.d.ts`     | `*.css` module declaration                      | Allows TypeScript to resolve CSS imports                                                                                               |

**Layered constraints**: `types/` may import from npm packages and browser APIs, but **must NOT** import from `core/`, `ui/`, or `features/`.

**HAST Node Types** (defined in `hast.ts`):

| Node type | JSON shape                                                                        | Rendered as                       |
| --------- | --------------------------------------------------------------------------------- | --------------------------------- |
| `root`    | `{ "type": "root", "children": [...] }`                                           | Fragment wrapper (no DOM element) |
| `element` | `{ "type": "element", "tagName": "...", "properties": {...}, "children": [...] }` | HTML element                      |
| `text`    | `{ "type": "text", "value": "..." }`                                              | Text node                         |
| `comment` | `{ "type": "comment", "value": "..." }`                                           | HTML comment                      |

**HAST Property Naming**: HAST uses `className` (string or array) instead of `class`, and `data*` attributes are camelCase (e.g. `dataI18n` → `data-i18n`). Both `hast-util-to-html` and `setElementAttributes` (in `utils.ts`) handle kebab-case conversion automatically.

```json
{
  "className": ["external-link"],
  "href": "https://example.com",
  "dataI18n": "text-foo",
  "dataImgFeature": "colored"
}
```

→ `<a class="external-link" href="https://example.com" data-i18n="text-foo" data-img-feature="colored">`

#### 3.3.2 Build-time Types (`build/types.ts`)

Located in `build/types.ts` and used by Vite plugins and build scripts. Type-checked by `tsconfig.build.json` (targets `Node` lib via `@types/node`).

| Type                  | Purpose                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `PageMetaEntry`       | Single page metadata entry (title, description, pagePath, robots, jsonLDType, tier)      |
| `PageMetaMap`         | `Record<string, PageMetaEntry>` - the shape of `PAGE_META` in `page-meta.ts`             |
| `PageTier`            | `'full' \| 'lightweight' \| 'none'` - controls which entry script and head tags are used |
| `JsonLDType`          | `'homepage' \| 'breadcrumb' \| 'none'` - determines JSON-LD structured data format       |
| `CardData`            | Link-card descriptor (`available`, `icon`, `title`, `description`)                       |
| `GroupData`           | Link-card group descriptor (`title`, `description`, `contents`)                          |
| `LinkButtonData`      | Link-button descriptor (`externalLink`, `linkHref`, `iconProps`, `primary?`)             |
| `LinkButtonGroupData` | Link-button-group descriptor (`groupId`, `buttons`)                                      |

Build-time types may import from npm packages, Node.js APIs, and `src/types/`. They exist only at build time - never bundled into browser output.

#### 3.3.3 Link-card JSON Format (`build/configs/link-cards/*.json`)

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

#### 3.3.4 Link-button-group JSON Format (`build/configs/link-button-groups/*.json`)

Each page's link button groups are defined as a JSON array of **Link Button Groups** (`LinkButtonGroupData[]`). Unlike link cards, these use a simplified data format - the builder converts them into HAST.

**Top-level: Link Button Group**

```json
{
  "groupId": "artworks",
  "buttons": [
    /* array of Link Buttons */
  ]
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

- `externalLink`: Boolean. `true` → `external-link` class + `data-link-img-props`; `false` → `internal-link` class + `data-no-qr-code`.
- `linkHref`: The link URL.
- `primary`: Optional boolean placeholder (currently unused - all buttons use `btn-outline-secondary`).
- `iconProps`: `HastProperties` for the `<img>` child. `alt` is also used to derive `data-bs-title`; `dataI18nAlt` is used to derive `data-i18n-tooltip`.

For how button groups are rendered and injected, see §4.2.5 Link Button Group Injection in the [Build-time Injection](../4-feature-references/2-build-time-injection.instructions.md#425-link-button-group-injection) documentation.
