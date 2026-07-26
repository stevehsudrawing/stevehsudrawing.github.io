---
description: >
  Image utilities: unified data-img-feature attribute system for image behaviors - follow-theme
  (theme-based src swapping between light/dark variants), colored (CSS mask-based monochrome
  coloring via --shlh-* color variables), loading-opacity (semi-transparent while loading, fade
  to opaque on load).
  Use when: modifying img-utils.ts, img-utils.css, theme.ts, or adding data-img-feature attributes.
applyTo: >
  src/ui/img-utils.ts;
  src/stylesheets/img-utils.css;
  src/ui/theme.ts
---

### 4.13 Image Utilities

**Brief**: Provides a unified `data-img-feature` attribute system for image behaviors such as theme-following source swapping, CSS mask-based monochrome coloring, and loading-state opacity control.

**Related Files**:

| File                            | Role                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `src/ui/img-utils.ts`           | Initializes `data-img-feature="colored"` images and image loading opacity            |
| `src/stylesheets/img-utils.css` | CSS rules for `[data-img-feature~="colored"]` mask-based styling and loading opacity |
| `src/ui/theme.ts`               | `applyAllThemeBasedImages()` handles `data-img-feature~="follow-theme"` images       |
| `public/images/webp/null.webp`  | Placeholder image used with `data-img-feature="colored"`                             |
| `public/images/README.md`       | Copyright notice for image assets                                                    |

#### 4.13.1 `data-img-feature` Attribute

The `data-img-feature` attribute on `<img>` elements declares which image features apply. Multiple features are space-separated (e.g. `data-img-feature="follow-theme colored"`).

#### 4.13.2 `follow-theme`

Swaps `src` between light and dark variants based on the current theme.

- `data-img-feature="follow-theme"` - enables theme-based source swapping
- `data-src-light` - URL for the light-theme image (populated automatically if missing)
- `data-src-dark` - URL for the dark-theme image

Handled by `applyAllThemeBasedImages()` in `theme.ts` (see [§4.4 Theme System](4-theme-system.instructions.md#44-theme-system)).

#### 4.13.3 `colored`

Renders monochrome icons via CSS `mask-image`, colored by a CSS custom property.

- `data-img-feature="colored"` - enables mask-based coloring
- `data-src-mask` - path to the mask source image (e.g. `/images/webp/icons/email.webp`)
- `data-color-var` - CSS variable name (without `--` prefix) for the fill color (e.g. `bs-body-color`, `shlh-primary-color`)

Handled by `initAllColoredImages()` in `img-utils.ts`, which sets `--img-mask-url` and `--img-color` CSS custom properties on each element. The generic CSS in `img-utils.css` applies `background-color` and `mask` based on these properties.

#### 4.13.4 `loading-opacity`

Renders `<img>` elements semi-transparent (`opacity: 0.5`) while their source is loading, then fades to fully opaque (`opacity: 1`) once the image has loaded. Colored images (`data-img-feature~="colored"`) are excluded because their visual comes from CSS `mask` / `background-color` rather than the `src`.

- **Default state**: All `<img>` elements are `opacity: 0.5` with `transition: opacity .2s ease`.
- **Loaded state**: When an image finishes loading (or is already cached), the `data-img-loaded` attribute is added, which sets `opacity: 1`.
- **Error state**: Images that fail to load are also marked as loaded to prevent them from staying semi-transparent forever.

**Key Functions** (in `img-utils.ts`):

| Function                       | Role                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `markImageLoaded(img)`         | Adds `data-img-loaded` attribute → `opacity: 1`                                |
| `markImageUnloaded(img)`       | Removes `data-img-loaded` attribute → `opacity: 0.5`                           |
| `initImageLoadingOpacity(img)` | Checks if image is cached (mark immediately) or binds `load`/`error` listeners |
| `initAllImageLoadingOpacity()` | Batch function: calls `initImageLoadingOpacity()` on every `<img>`             |

**CSS Rules** (in `img-utils.css`):

```css
img {
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

img[data-img-loaded],
img[data-img-feature~="colored"] {
  opacity: 1;
}
```

**Interaction with Theme System** ([§4.4](4-theme-system.instructions.md#44-theme-system)):

When `applyThemeBasedImage()` switches the `src` of a `follow-theme` image during theme changes, it calls `markImageUnloaded(img)` before changing `src` and `initImageLoadingOpacity(img)` afterward. This prevents the old theme's image from briefly remaining visible at full opacity while the new theme's image loads.
