---
description: >
  Feature-Aware Image: FeatureAwareImg.vue (theme-swap, colored mask, loading-opacity modes),
  useImgFeatures.ts composable (global document scan), useImgDisplayProps.ts (HAST extraction).
  data-img-feature attribute system.  Use when: modifying image behavior, adding new image
  feature modes, or working with imgProperties HAST data.
applyTo: >
  src/components/ui/FeatureAwareImg.vue;
  src/composables/useImgFeatures.ts;
  src/composables/useImgDisplayProps.ts
---

#### 4.2.4 Feature-Aware Image

##### 4.2.4.1 Props

| Prop           | Type      | Purpose                                           |
| -------------- | --------- | ------------------------------------------------- |
| `lightSrc`     | `string`  | Light-mode image source (required)                |
| `darkSrc`      | `string?` | Dark-mode image source                            |
| `feature`      | `string?` | Space-separated modes: `"follow-theme" "colored"` |
| `colorMaskSrc` | `string?` | Mask image URL for colored mode                   |
| `colorVar`     | `string?` | CSS variable for colored mode fill                |

##### 4.2.4.2 Feature Modes

| Mode           | Behavior                                                               |
| -------------- | ---------------------------------------------------------------------- |
| `follow-theme` | Swaps `src` between `lightSrc` and `darkSrc` based on `effectiveTheme` |
| `colored`      | CSS mask: `-webkit-mask-image`, `background-color: var(--colorVar)`    |
| _(default)_    | Loading opacity: semi-transparent until `onLoad`, then fade to opaque  |

##### 4.2.4.3 useImgDisplayProps() Composable

Shared by `ExternalLinkConfirmModal` and `QRCodeModal`:

```ts
const { src, alt, feature, colorVar, colorMaskSrc } =
  useImgDisplayProps(source);
```

Maps HAST camelCase properties (`dataImgFeature`, `dataColorVar`, `dataSrcMask`)
to computed refs.

##### 4.2.4.4 Global Document Scan

`useImgFeatures.ts` exports `initAllColoredImages()` and
`initAllImageLoadingOpacity()` for build-time injected `[data-img-feature]`
images outside Vue's render tree.
