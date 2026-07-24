### 4.5 Link Cards

**Brief**: Renders link-card groups from JSON configuration files in a hybrid HAST format. Content subtrees are rendered via `hast-util-to-html`; card scaffolding is built with `document.createElement`. QR buttons and title anchors are added via post-processing.

**Related Files**:

| File                                    | Role                                            |
|-----------------------------------------|-------------------------------------------------|
| `src/features/link-cards-generator.ts`  | Generates link-card DOM elements from JSON data |
| `public/configs/links/{page-name}.json` | Link-card group definitions for each page       |

#### 4.5.1 JSON Structural Standards

The link-card JSON files use a **hybrid HAST format**: the top-level structure defines semantic groupings (Link Card Groups, Link Cards), while content values inside them use [HAST](https://github.com/syntax-tree/hast) (Hypertext Abstract Syntax Tree) nodes. Content subtrees are rendered via `hast-util-to-html` (`window.toHtml`), while the card scaffolding (Bootstrap grid, card wrappers) is built with `document.createElement`.

##### 4.5.1.1 HAST Node Types Used

| Node type | JSON shape                                                                        | Rendered as                       |
|-----------|-----------------------------------------------------------------------------------|-----------------------------------|
| `root`    | `{ "type": "root", "children": [...] }`                                           | Fragment wrapper (no DOM element) |
| `element` | `{ "type": "element", "tagName": "...", "properties": {...}, "children": [...] }` | HTML element                      |
| `text`    | `{ "type": "text", "value": "..." }`                                              | Text node                         |
| `comment` | `{ "type": "comment", "value": "..." }`                                           | HTML comment                      |

##### 4.5.1.2 Property Naming (HAST Convention)

HAST uses `className` (array) instead of `class` (string), and `data*` attributes are camelCase (e.g. `dataI18n` → `data-i18n`). `hast-util-to-html` and `setElementAttributes` (utils.ts) both handle the kebab-case conversion automatically.

```json
// HAST properties:
{
    "className": ["external-link"],
    "href": "https://example.com",
    "dataI18n": "text-foo",
    "dataI18nHtml": "html-bar",
    "dataImgFeature": "colored",
    "dataSrcMask": "/images/webp/icons/email.webp",
    "dataColorVar": "bs-body-color"
}
// → <a class="external-link" href="https://..." data-i18n="text-foo" data-i18n-html="html-bar" ...>
```

##### 4.5.1.3 Link Card Group (top-level)

```json
{
    "title": {
        "type": "element",
        "tagName": "span",
        "properties": { "dataI18n": "text-artworks" },
        "children": [{ "type": "text", "value": "Artworks" }]
    },
    "description": {
        "type": "root",
        "children": [
            {
                "type": "element",
                "tagName": "span",
                "properties": { "dataI18nHtml": "html-artworks-description" },
                "children": [{ "type": "text", "value": "Preferred styles: ..." }]
            }
        ]
    },
    "contents": [ /* array of Link Cards */ ]
}
```

- `title`: A HAST node (usually a `<span>` with `dataI18n`) — rendered inside an `<h4>`.
- `description`: A HAST node (`null` if absent) — rendered inside a `<p>`.
- `contents`: Array of Link Cards.

##### 4.5.1.4 Link Card

```json
{
    "available": true,
    "icon": {
        "type": "element",
        "tagName": "img",
        "properties": {
            "alt": "Pixiv",
            "src": "/images/webp/icons/pixiv.webp"
        },
        "children": []
    },
    "title": {
        "type": "element",
        "tagName": "a",
        "properties": {
            "href": "https://www.pixiv.net/users/70732361",
            "className": ["external-link"]
        },
        "children": [{
            "type": "element",
            "tagName": "span",
            "children": [{ "type": "text", "value": "Pixiv" }]
        }]
    },
    "description": {
        "type": "root",
        "children": [{
            "type": "element",
            "tagName": "span",
            "children": [{ "type": "text", "value": "UID: 70732361" }]
        }]
    }
}
```

- `available`: Boolean. When not `true`, the card gets class `opacity-75`.
- `icon`: A HAST `<img>` element (`null` if absent). Its `properties` are also passed to `showQRCodeModal()` for the centre icon.
- `title`: A HAST node — rendered inside an `<h6>`. When it is a single `<a>`, the `<h6>` gets `d-flex align-items-center justify-content-between` for QR button layout. External links in the title automatically get QR-code buttons.
- `description`: A HAST node (`null` if absent) — rendered inside a `<p>`.

**Interaction with Other Systems**:

- **i18n ([§4.3](3-internationalization-i18n.md#43-internationalization-i18n))**: HAST properties use camelCase `dataI18n` / `dataI18nHtml` / `dataI18nAlt`. `toHtml()` converts them to kebab-case HTML attributes. `updatePageText()` is called after card generation.
- **QR Code ([§4.10](10-qr-code-export.md#410-qr-code--export))**: External links (`<a>` with `href`) inside card titles automatically get adjacent QR-code buttons via post-processing (`addQRButtonsToElement`). The card's icon properties are passed to `showQRCodeModal()`.
- **Image Utilities ([§4.13](13-image-utilities.md#413-image-utilities))**: Card icons use `dataImgFeature` (`"colored"` or `"follow-theme"`) — see [§4.13.1](#4131-data-img-feature-attribute). `setElementAttributes` converts camelCase to kebab-case.
- **Utilities ([§4.15](15-utilities.md#415-utilities))**: Uses `extractPageName()` to resolve the JSON config path and `toDashCase()` / `extractPlainText()` for group title IDs.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.md#417-external-link-confirmation))**: Links with `className: ["external-link"]` trigger the confirmation modal. Card title and description links automatically receive `data-link-img-props` (using the card's icon properties) so the confirmation modal can display the icon.
- **Page Transition ([§4.6](6-page-transitions.md#46-page-transitions))**: Links with `className: ["internal-link"]` trigger SPA navigation.


