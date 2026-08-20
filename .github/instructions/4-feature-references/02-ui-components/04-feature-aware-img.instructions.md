---
description: >
  Image components: FeatureAwarePicture.vue (universal non-colored image),
  ColoredImg.vue (CSS mask + tint), TypeAwareImage.vue (picture | colored-img
  discriminator), useHastToVue.ts (HAST extraction). srcMap-based responsive
  source maps with theme + language awareness.
  Use when: modifying image behavior, adding new image feature modes, or
  working with PictureSrcMap / ColoredImgProps / TypeAwareImageProps types.
applyTo: >
  src/components/images/FeatureAwarePicture.vue;
  src/components/images/ColoredImg.vue;
  src/components/images/TypeAwareImage.vue;
  src/composables/useHastToVue.ts;
  src/types/app.ts
---

#### 4.2.4 Image Components

Two components handle all image rendering, plus a discriminator wrapper:

| Component                 | Purpose                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `FeatureAwarePicture.vue` | Universal non-colored images: static `<img>`, feature-driven `<img>`, or `<picture>` with AVIF/WebP sources                    |
| `ColoredImg.vue`          | CSS mask + tint rendering (`data-img-feature="colored"`)                                                                       |
| `TypeAwareImage.vue`      | `{ image: TypeAwareImageProps }` — renders `FeatureAwarePicture` for `type: "picture"`, `ColoredImg` for `type: "colored-img"` |

`FeatureAwareImg.vue` has been removed — its functionality is merged into
`FeatureAwarePicture.vue`. All three live in `src/components/images/`.

##### 4.2.4.1 FeatureAwarePicture Props

| Prop               | Type                         | Purpose                                                                |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------- |
| `src`              | `string?`                    | Static URL. Mutually exclusive with `srcMap`.                          |
| `srcMap`           | `PictureSrcMap?`             | Multi-format source map. Mutually exclusive with `src`.                |
| `feature`          | `ImgFeature[]?`              | `"follow-theme"` / `"follow-language"` — drive resolution on `srcMap`. |
| `alt`              | `string?`                    | Alt text (pre-resolved from i18n). Optional — the img may omit it.     |
| `class`            | `string?`                    | Additional CSS classes.                                                |
| `fetchpriority`    | `"high" \| "low" \| "auto"?` | Native fetchpriority.                                                  |
| `loading`          | `"lazy" \| "eager"?`         | Native lazy loading.                                                   |
| `width` / `height` | `number?`                    | Image dimensions.                                                      |

**Rendering strategy:**

- `src` provided → bare `<img>` with static src
- `srcMap` without `avif` → bare `<img>` with theme/language-resolved src
- `srcMap` with `avif` → `<picture>` with AVIF + WebP `<source>` elements

The props are the shared `FeatureAwarePictureProps` interface in
`src/types/app.ts` — `FeatureAwarePicture.vue` consumes it directly
(`defineProps<FeatureAwarePictureProps>()`), no inline mirror.

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
// Shared with markdown content selection (useMarkdownContent).
type LanguageAwareString = {
  en: string; // Required — ultimate fallback
} & Partial<Record<Exclude<Lang, "en">, string>>;

interface ThemeAwareImgSrcMap {
  light: LanguageAwareString; // Required — ultimate fallback
  dark?: LanguageAwareString;
}

// Language resolution (theme → light/dark, language → exact/en fallback)
// is centralized in `resolveLanguageAwareString` (core/utils.ts), shared
// with markdown content selection.

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

##### 4.2.4.5 TypeAwareImageProps

```ts
type TypeAwareImageProps =
  | { type: "picture"; imgProps: FeatureAwarePictureProps }
  | { type: "colored-img"; imgProps: ColoredImgProps };
```

`TypeAwareImage.vue` consumes `{ image: TypeAwareImageProps }` and dispatches to
`FeatureAwarePicture` or `ColoredImg`. It is used by `LinkCard`, `LinkButton`,
`ExternalLinkConfirmModal`, `QRCodeModal`, and `PictureViewerModal`.

> Prefer the typed `icon: TypeAwareImageProps` passthrough on `TypeAwareLink`
> and `QRCodeButton` over the HAST round-trip. `useImgDisplayProps.ts` has been
> removed — HAST content uses `extractPictureProps` / `extractColoredImgProps`
> directly.
