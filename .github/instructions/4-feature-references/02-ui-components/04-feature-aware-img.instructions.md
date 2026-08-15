---
description: >
  Image components: FeatureAwarePicture.vue (universal non-colored image),
  ColoredImg.vue (CSS mask + tint), useImgDisplayProps.ts (HAST extraction).
  srcMap-based responsive source maps with theme + language awareness.
  Use when: modifying image behavior, adding new image feature modes, or
  working with PictureSrcMap / ColoredImgProps types.
applyTo: >
  src/components/ui/FeatureAwarePicture.vue;
  src/components/ui/ColoredImg.vue;
  src/composables/useImgDisplayProps.ts;
  src/composables/useHastToVue.ts;
  src/types/app.ts
---

#### 4.2.4 Image Components

Two components handle all image rendering:

| Component                 | Purpose                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `FeatureAwarePicture.vue` | Universal non-colored images: static `<img>`, feature-driven `<img>`, or `<picture>` with AVIF/WebP sources |
| `ColoredImg.vue`          | CSS mask + tint rendering (`data-img-feature="colored"`)                                                    |

`FeatureAwareImg.vue` has been removed — its functionality is merged into
`FeatureAwarePicture.vue`.

##### 4.2.4.1 FeatureAwarePicture Props

| Prop               | Type                         | Purpose                                                                |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------- |
| `src`              | `string?`                    | Static URL. Mutually exclusive with `srcMap`.                          |
| `srcMap`           | `PictureSrcMap?`             | Multi-format source map. Mutually exclusive with `src`.                |
| `feature`          | `ImgFeature[]?`              | `"follow-theme"` / `"follow-language"` — drive resolution on `srcMap`. |
| `alt`              | `string`                     | Alt text (pre-resolved from i18n).                                     |
| `class`            | `string?`                    | Additional CSS classes.                                                |
| `fetchpriority`    | `"high" \| "low" \| "auto"?` | Native fetchpriority.                                                  |
| `loading`          | `"lazy" \| "eager"?`         | Native lazy loading.                                                   |
| `width` / `height` | `number?`                    | Image dimensions.                                                      |

**Rendering strategy:**

- `src` provided → bare `<img>` with static src
- `srcMap` without `avif` → bare `<img>` with theme/language-resolved src
- `srcMap` with `avif` → `<picture>` with AVIF + WebP `<source>` elements

##### 4.2.4.2 ColoredImg Props

| Prop               | Type                 | Purpose                                                   |
| ------------------ | -------------------- | --------------------------------------------------------- |
| `src`              | `string`             | Mask image (SVG/PNG shape).                               |
| `colorVar`         | `string`             | CSS variable name for tint (e.g. `"shlh-primary-color"`). |
| `alt`              | `string`             | Alt text.                                                 |
| `class`            | `string?`            | Additional CSS classes.                                   |
| `loading`          | `"lazy" \| "eager"?` | Native lazy loading.                                      |
| `width` / `height` | `number?`            | Image dimensions.                                         |

##### 4.2.4.3 Source Map Types

```ts
type ImgFeature = "follow-theme" | "follow-language";

// Keys derived from Lang — en required, others optional.
type LanguageAwareImgSrcMap = {
  en: string; // Required — ultimate fallback
} & Partial<Record<Exclude<Lang, "en">, string>>;

interface ThemeAwareImgSrcMap {
  light: LanguageAwareImgSrcMap; // Required — ultimate fallback
  dark?: LanguageAwareImgSrcMap;
}

interface PictureSrcMap {
  webp: ThemeAwareImgSrcMap; // Required
  avif?: ThemeAwareImgSrcMap;
}
```

**Fallback chain:**

- Language: exact match → `en` (no intermediate chain)
- Theme: `dark` → `light`
- Format: `avif` → `webp` (browser-native via `<picture>`)

##### 4.2.4.4 HAST Extraction (useHastToVue.ts)

```ts
// Non-colored → FeatureAwarePicture
extractPictureProps(imgNode, t)  → FeatureAwarePictureProps | null

// Colored → ColoredImg
extractColoredImgProps(imgNode, t) → ColoredImgProps | null
```

Branching rule: if `dataImgFeature` contains `"colored"` → `ColoredImg`,
otherwise → `FeatureAwarePicture`.

##### 4.2.4.5 useImgDisplayProps() Composable

Used by modal components that receive HAST-like properties:

```ts
const { src, alt, feature, colorVar, colorMaskSrc, isColored } =
  useImgDisplayProps(source);
```

- `feature` — parsed `ImgFeature[]` (space-separated string in HAST → array)
- `isColored` — `true` when `dataImgFeature` includes `"colored"`

> Prefer the typed `pictureProps` / `coloredProps` passthrough in
> `TypeAwareLink` and `QRCodeButton` over the HAST round-trip.
