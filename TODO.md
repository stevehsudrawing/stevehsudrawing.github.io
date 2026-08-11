# TODO — Image Component Refactoring

**VERSION 3.6 BREAKING CHANGE**

Refactor the image component layer:

- Merge `FeatureAwareImg` into `FeatureAwarePicture` (single universal
  component for all non-colored images).
- Add `follow-language` responsive-image feature.
- Change `feature` from `string` to `string[]`.
- Introduce `srcMap: PictureSrcMap` to replace flat per-variant props.
- Add `src: string` for static URLs (mutually exclusive with `srcMap`).
- Extract `colored` rendering into a standalone `ColoredImg` component.
- Replace untyped `imgProps: Record<string, unknown>` passthrough with
  typed `pictureProps` / `coloredProps` in the modal pipeline.

---

### Design Principles

1. **`colored` is NOT an `ImgFeature`**. After extracting `ColoredImg`,
   `ImgFeature` only contains `"follow-theme" | "follow-language"`. The
   `colored` rendering approach (CSS mask + tint) is fundamentally different
   from feature-driven src-switching — extracting it decouples the two
   concerns entirely.

2. **`FeatureAwarePicture` is the sole non-colored image component**.
   `FeatureAwareImg` is removed. `FeatureAwarePicture` handles everything:
   static `<img>`, feature-driven `<img>`, and `<picture>` with AVIF/WebP
   sources — based on whether `src`, `srcMap`, and `srcMap.avif` are present.

3. **`src` and `srcMap` are mutually exclusive**. `src: string` for static
   URLs (no feature processing). `srcMap: PictureSrcMap` for structured
   multi-format sources (used with `feature` to drive resolution). When
   neither `follow-theme` nor `follow-language` is in `feature`, the
   light/en variant is used.

4. **`srcMap` is always `PictureSrcMap`** — no `string | ThemeAwareImgSrcMap`
   union. The component internally decides whether to render `<picture>`
   (when `srcMap.avif` is present) or a bare `<img>`.

5. **`feature: ImgFeature[]` is internal-only**. `FeatureAwarePicture` no
   longer writes `data-img-feature` to the DOM. Only `ColoredImg` outputs
   `data-img-feature="colored"` (static) for its CSS mask rules.

6. **HAST must remain renderable as valid native HTML**. In HAST JSON,
   `dataImgFeature` stays as a space-separated `string`. The HAST → Vue
   extraction layer (composables) is responsible for `.split(" ")` and
   routing to the correct Vue component (`ColoredImg` vs
   `FeatureAwarePicture`).

7. **`ColoredImg` and `FeatureAwarePicture` are mutually exclusive**. When
   `dataImgFeature` contains `"colored"`, the extraction layer outputs
   `ColoredImgProps` — never `FeatureAwarePictureProps`. The two code paths
   never overlap.

8. **Fallback chain** — when a theme/language variant is not specified:
   - **Language**: `zh-Hant` → `zh-Hans` → `en` (the required key).
   - **Theme**: `dark` → `light` (the required key).
   - **Format**: `avif` → `webp` (the required key; decided by browser via
     native `<picture>` semantics).

9. **Typed props passthrough for modals** — `TypeAwareLink` and
   `QRCodeButton` use `pictureProps?: FeatureAwarePictureProps` and
   `coloredProps?: ColoredImgProps` instead of the untyped
   `imgProps: Record<string, unknown>`. Modal components receive these
   typed props directly, eliminating the HAST round-trip
   (`Record<string, unknown>` → `useImgDisplayProps()` → back to typed).

---

## 1. Type Definitions (`src/types/app.ts`)

### 1.1 Add New Interfaces

- [x] **`ImgFeature`** — union type of valid feature flags:

  ```ts
  type ImgFeature = "follow-theme" | "follow-language";
  ```

- [x] **`LanguageAwareImgSrcMap`** — language-keyed source map. `en` is
      required (ultimate fallback):

  ```ts
  interface LanguageAwareImgSrcMap {
    en: string;
    "zh-Hans"?: string;
    "zh-Hant"?: string;
  }
  ```

- [x] **`ThemeAwareImgSrcMap`** — theme-keyed source map. `light` is
      required (ultimate fallback):

  ```ts
  interface ThemeAwareImgSrcMap {
    light: LanguageAwareImgSrcMap;
    dark?: LanguageAwareImgSrcMap;
  }
  ```

- [x] **`PictureSrcMap`** — format-keyed source map. `webp` is required
      (browser baseline; ultimate fallback for `<img>`):

  ```ts
  interface PictureSrcMap {
    webp: ThemeAwareImgSrcMap;
    avif?: ThemeAwareImgSrcMap;
  }
  ```

- [x] **`ColoredImgProps`** — props for the new `ColoredImg` component:
  ```ts
  interface ColoredImgProps {
    /** Mask image source (the SVG/PNG shape). */
    src: string;
    /** CSS variable name for the tint color (e.g. "shlh-primary-color"). */
    colorVar: string;
    /** Alt text (pre-resolved from i18n). */
    alt: string;
    width?: number;
    height?: number;
    /** Additional CSS classes. */
    class?: string;
    loading?: "lazy" | "eager";
  }
  ```

### 1.2 New Unified Props Interface

- [x] **`FeatureAwarePictureProps`** — single interface replacing both
      `FeatureAwareImgProps` and `HeroImageProps`:
  ```ts
  interface FeatureAwarePictureProps {
    /**
     * Static src URL.
     * Use for plain images (GitHub avatars, external favicons, etc.).
     * Mutually exclusive with `srcMap`.
     */
    src?: string;
    /**
     * Structured multi-format source map.
     * Use with `feature` for theme/language-aware resolution.
     * Mutually exclusive with `src`.
     */
    srcMap?: PictureSrcMap;
    /** Feature flags — drive theme/language resolution on `srcMap`. */
    feature?: ImgFeature[];
    /** Alt text (pre-resolved from i18n). */
    alt: string;
    width?: number;
    height?: number;
    /** Additional CSS classes for the img element. */
    class?: string;
    /** fetchpriority attribute (e.g. "high" for hero images). */
    fetchpriority?: "high" | "low" | "auto" | undefined;
    loading?: "lazy" | "eager";
  }
  ```
  > `src` and `srcMap` are mutually exclusive. `feature` is only meaningful
  > with `srcMap`.

### 1.3 Remove

- [x] **`FeatureAwareImgProps`** — replaced by `FeatureAwarePictureProps`.
- [x] **`HeroImageProps`** — replaced by `FeatureAwarePictureProps`.
- [x] All old flat src props: `lightSrc`, `darkSrc`, `avifSrcLight`,
      `avifSrcDark`, `webpSrcLight`, `webpSrcDark`, `fallbackSrcLight`,
      `fallbackSrcDark`, `colorMaskSrc`, `colorVar` (the latter two moved to
      `ColoredImgProps`).

---

## 2. New Component: `ColoredImg.vue`

### 2.1 Create `src/components/ui/ColoredImg.vue`

- [x] `<script setup lang="ts">` with `ColoredImgProps`.
- [x] Render a plain `<img>` with:
  - `src` set to a transparent placeholder (`/images/webp/null.webp`).
  - `data-img-feature="colored"` — **static** attribute.
  - `--img-color` and `--img-mask-url` CSS custom properties via inline
    style.
  - `@load` / `@error` handlers (loading-opacity behavior).
  - `onMounted` completeness check.
- [x] **Scoped `<style>`**: `[data-img-feature~="colored"]` mask rules +
      loading-opacity rules.

### 2.2 Remove Colored CSS from `FeatureAwareImg.vue`

- [x] Delete the `[data-img-feature~="colored"]` rule block from
      `FeatureAwareImg.vue`'s non-scoped `<style>` (moved to `ColoredImg.vue`).

---

## 3. Delete `FeatureAwareImg.vue`

- [x] Remove `src/components/ui/FeatureAwareImg.vue` — all functionality
      merged into `FeatureAwarePicture.vue`.

---

## 4. Refactor `FeatureAwarePicture.vue`

This becomes the **sole** non-colored image component.

### 4.1 Props

- [x] Accept `FeatureAwarePictureProps`: `src?`, `srcMap?`, `feature?`,
      `alt`, `width`, `height`, `class?`, `fetchpriority?`, `loading?`.

### 4.2 Logic — src resolution

- [x] **`resolvedImgSrc` computed**: resolve the final `<img src>` URL.

  **When `srcMap` is provided:**
  1. Determine target theme: `feature?.includes("follow-theme")`
     → use `effectiveTheme`; otherwise → `"light"`.
  2. Determine target language: `feature?.includes("follow-language")`
     → use `locale`; otherwise → `"en"`.
  3. Look up `srcMap.webp[theme][lang]` with fallback chain:
     - lang: `zh-Hant` → `zh-Hans` → `en`
     - theme: `dark` → `light`

  **When `src` is provided:** returned as-is.

- [x] **`resolvedAvifSrc` computed**: same resolution logic applied to
      `srcMap.avif` (returns `undefined` when avif is absent).

- [x] **`renderPicture` computed**: `true` when `srcMap?.avif` is present
      (AVIF `<source>` + WebP `<source>` → `<picture>` is meaningful).

### 4.3 Logic — loading opacity

- [x] Keep `loaded` ref, `onLoad`, `onError`, `onMounted` completeness check
      (migrated from `FeatureAwareImg`).

### 4.4 Template

```html
<!-- With AVIF: full <picture> -->
<picture v-if="renderPicture">
  <source
    type="image/avif"
    :srcset="resolvedAvifSrc"
    :fetchpriority="fetchpriority"
  />
  <img
    :src="resolvedImgSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :class="class"
    :loading="loading"
    :data-img-loaded="loaded ? '' : undefined"
    @load="onLoad"
    @error="onError"
  />
</picture>

<!-- No AVIF: bare <img> -->
<img
  v-else
  :src="resolvedImgSrc"
  :alt="alt"
  :width="width"
  :height="height"
  :class="class"
  :loading="loading"
  :fetchpriority="fetchpriority"
  :data-img-loaded="loaded ? '' : undefined"
  @load="onLoad"
  @error="onError"
/>
```

> No `data-img-feature` attribute — features are internal-only.

### 4.5 Non-scoped `<style>`

- [x] Keep `img { opacity: 0.5; transition: …; cursor: wait; }` and
      `img[data-img-loaded] { opacity: 1; cursor: inherit; }` rules (migrated
      from `FeatureAwareImg`).
- [x] Remove `[data-img-feature~="colored"]` rules (moved to `ColoredImg`).

---

## 5. Composables & HAST Extraction

### 5.1 `src/composables/useImgDisplayProps.ts`

- [x] Update `ImgDisplayProps` interface: replace `feature: string |
undefined` with `feature: ImgFeature[]`.
- [x] Add a discriminator or separate extraction for colored vs
      non-colored images.

### 5.2 `src/composables/useHastToVue.ts`

- [x] Remove `extractImgProps()`. Add:

  - [x] **`extractPictureProps()`** → `FeatureAwarePictureProps | null`.
        Parses `dataImgFeature` (space-separated string → `ImgFeature[]`,
        filtering out `"colored"`). `srcMap` is built from HAST `src` (as
        `webp.light.en`).

  - [x] **`extractColoredImgProps()`** → `ColoredImgProps | null`.
        Used when `dataImgFeature` includes `"colored"`.

  **Branching rule** (applied in `HastFragment.vue`):

  ```
  if dataImgFeature contains "colored"
    → extractColoredImgProps() → <ColoredImg>
  else
    → extractPictureProps()    → <FeatureAwarePicture>
  ```

### 5.3 `src/composables/useI18n.ts`

- [x] `locale: Ref<Lang>` already exposed — no changes needed.

---

## 6. Consumer Component Updates

All consumers replace `FeatureAwareImg` with the unified
`FeatureAwarePicture` (or `ColoredImg` for colored icons).

### 6.1 `src/components/ui/HastFragment.vue`

- [x] `<img>` → component mapping:
  - `"colored"` in `dataImgFeature` → `ColoredImg`
  - otherwise → `FeatureAwarePicture`
- [x] Import `ColoredImg`, `extractPictureProps`, `extractColoredImgProps`.
- [x] Remove `FeatureAwareImg` import.

### 6.2 `src/components/ui/HeroSection.vue`

- [x] Update `image` prop type: `HeroImageProps` → `FeatureAwarePictureProps`.
- [x] Template: `v-bind="image"` — verify prop names align (old
      `avifSrcLight` etc. → new `srcMap`).

### 6.3 `src/components/ui/StickerSection.vue`

- [x] Replace per-format computed props with a single `PictureSrcMap` computed.
- [x] Pass `:src-map="stickerSrcMap"` + `:feature="['follow-theme']"`.

### 6.4 `src/components/cards/LinkCard.vue`

- [x] Replace `FeatureAwareImg` with `FeatureAwarePicture` (or `ColoredImg`
      when the icon is colored).

### 6.5 `src/components/cards/GitHubUserCard.vue`

- [x] Replace `FeatureAwareImg` with `FeatureAwarePicture` using `:src`.

### 6.6 `src/components/buttons/LinkButton.vue`

- [x] Build `pictureProps` / `coloredProps` directly based on
      `imgDisplay.isColored`, instead of `typeAwareImgProps: Record<string, unknown>`.
- [x] Template: pass `:picture-props` or `:colored-props` to `TypeAwareLink`.

### 6.7 `src/components/buttons/QRCodeButton.vue`

- [x] Replace `imgProps?: Record<string, unknown>` with:
  - `pictureProps?: FeatureAwarePictureProps | null`
  - `coloredProps?: ColoredImgProps | null`

### 6.8 `src/components/links/TypeAwareLink.vue`

- [x] Replace `imgProps?: Record<string, unknown>` with:
  - `pictureProps?: FeatureAwarePictureProps | null`
  - `coloredProps?: ColoredImgProps | null`
- [x] Pass through to `openExternalLink()` as two separate args.

### 6.9 `src/components/modals/ExternalLinkConfirmModal.vue`

- [x] Accept `pictureProps?: FeatureAwarePictureProps | null` and
      `coloredProps?: ColoredImgProps | null` directly (no
      `useImgDisplayProps` round-trip).
- [x] Template: `v-if="coloredProps"` → `<ColoredImg>`,
      `v-else-if="pictureProps"` → `<FeatureAwarePicture>`.

### 6.10 `src/components/modals/QRCodeModal.vue`

- [x] Same as §6.9 — accept typed `pictureProps` / `coloredProps` directly.
- [x] Remove `useImgDisplayProps` usage for center icon.

### 6.11 `src/App.vue`

- [x] Update `provide` signatures: two separate args
      (`pictureProps` + `coloredProps`) instead of one `Record<string, unknown>`.
- [x] Store two separate refs for modal consumption.

### 6.12 All `img-props` callers → `picture-props` / `colored-props`

All templates that currently pass `:img-props="{...}"` to `TypeAwareLink`
or `QRCodeButton` switch to the appropriate typed prop:

- [x] `src/components/nav/FooterNav.vue` — 3 colored icons → `:colored-props`
- [x] `src/components/cards/GitHubUserCard.vue` — 2 colored GitHub icons → `:colored-props`
- [x] `src/components/cards/LinkCard.vue` — switch to `:picture-props` or `:colored-props`
- [x] `src/pages/IndexPage.vue` — carousel Pixiv icons → `:picture-props`
- [x] `src/pages/AboutPage.vue` — Afdian icon → `:picture-props`

---

## 7. Page Updates

All pages that pass `HeroImageProps` to `HeroSection` need their image
objects restructured to the new `PictureSrcMap` format.

### 7.1 `src/pages/IndexPage.vue`

- [x] Carousel slides: replace individual `avif-src-light` etc. props on
      `FeatureAwarePicture` with a `PictureSrcMap`.
- [x] Hero sections (softwares, blogs, chatting): replace flat image objects
      with `PictureSrcMap`.
- [x] Sticker section: update `FeatureAwarePicture` usage.

### 7.2 `src/pages/AboutPage.vue`

- [x] Hero image object → `PictureSrcMap`.

### 7.3 `src/pages/ArtworksPage.vue`

- [x] Hero image object → `PictureSrcMap` (includes dark variant).

### 7.4 `src/pages/BlogsPage.vue`

- [x] Hero image object → `PictureSrcMap`.

### 7.5 `src/pages/ChattingPage.vue`

- [x] Hero image object → `PictureSrcMap`.

### 7.6 `src/pages/CopyrightPage.vue`

- [x] Hero image object → `PictureSrcMap`.

### 7.7 `src/pages/SoftwaresPage.vue`

- [x] Hero image object → `PictureSrcMap`.

---

## 8. CSS Updates

### 8.1 `src/components/ui/ColoredImg.vue` (scoped)

- [x] `[data-img-feature~="colored"]` mask rules:
  ```css
  [data-img-feature~="colored"] {
    background-color: var(--img-color, var(--bs-body-color));
    mask: var(--img-mask-url, none) no-repeat center / contain;
    -webkit-mask: var(--img-mask-url, none) no-repeat center / contain;
  }
  ```
- [x] Loading-opacity rules scoped to `ColoredImg`.

### 8.2 `src/components/ui/FeatureAwarePicture.vue` (non-scoped)

- [x] Migrate `img { opacity: 0.5; … }` + `img[data-img-loaded]` rules
      from `FeatureAwareImg.vue`.
- [x] Remove `[data-img-feature~="colored"]` (moved to `ColoredImg`).

### 8.3 `src/stylesheets/global/base.css`

- [x] Review §Image Utilities block. Comment updated.

---

## 9. HAST JSON Config Updates

HAST JSON configs (`link-cards/`, `link-button-groups/`) continue to use
flat `src` / `dataImgFeature` / `dataSrcMask` / `dataColorVar` — `srcMap` is
a Vue-layer abstraction.

### 9.1 `src/configs/link-cards/`

- [x] Verify `dataImgFeature: "colored"` icons route to `ColoredImg`.

### 9.2 `src/configs/link-button-groups/`

- [x] Same verification as §9.1.

---

## 10. Build Scripts

### 10.1 `build/content-injection-plugin.ts`

- [x] Review for references to removed types — none found.

---

## 11. Verification

- [x] `pnpm typecheck` — passes with zero errors.
- [x] `pnpm build` — completes successfully.
- [x] `pnpm preview` — visual smoke test:
  - [x] Theme switching (light ↔ dark): images swap correctly.
  - [x] Language switching (en ↔ zh-Hans ↔ zh-Hant): language-aware images
        swap correctly (after `follow-language` images are created).
  - [x] Colored icons (link buttons, link cards, modal icons) render with
        correct tint.
  - [x] Hero-section images on all 7 pages render correctly.
  - [x] Carousel images on IndexPage render correctly.
  - [x] Sticker-section images on IndexPage + AboutPage render correctly.
  - [x] QR code modal centre icon renders correctly.
  - [x] External link modal icon renders correctly.
  - [x] Loading opacity transition works for all image types.

---

## 12. Instruction Document Updates

- [x] Update `.github/instructions/4-feature-references/02-ui-components/04-feature-aware-img.instructions.md`
      to document the new `ColoredImg`, `srcMap` types, and updated component APIs.
- [x] Update `.github/instructions/3-project-structural-constraints/3-type-definitions.instructions.md`
      for new/updated image-related type definitions.
