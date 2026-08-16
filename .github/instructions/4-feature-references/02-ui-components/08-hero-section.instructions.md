---
description: >
  HeroSection.vue: reusable page hero section with heading, description,
  FeatureAwarePicture, and optional default slot.  Used by all 7 full pages.
  Use when: modifying hero-section layout, adding new page heroes, or changing
  the shared flex-column responsive pattern.
applyTo: >
  src/components/ui/HeroSection.vue;
  src/types/app.ts
---

#### 4.2.8 Hero Section

`HeroSection.vue` replaces ~15 lines of repetitive HTML across 8 hero
sections on 7 pages. It renders a heading, description, and cover image
in a responsive flex layout driven by `useBreakpoint()`.

##### 4.2.8.0 Layout & CLS

- **Wide** (`breakpoint !== "mobile"`, i.e. tablet/desktop): row layout —
  text left, image right, vertically centered.
- **Mobile**: column layout — image pinned to the **top-right**, text and
  slot content below.
- The image is forced to a **fixed 240×240 box** (`width` / `height`
  props overridden to `240`, and `.hero-img-wrapper` reserves 240×240 in
  CSS), so the hero contributes **zero CLS**. No `img-fluid` / `img-fit`
  classes are needed on hero images.

##### 4.2.8.1 Props

| Prop          | Type                       | Default | Notes                                        |
| ------------- | -------------------------- | ------- | -------------------------------------------- |
| `title`       | `string`                   | —       | Pre-resolved i18n text                       |
| `headingTag`  | `"h1" \| "h2"`             | `"h1"`  | Semantic tag; always styled with `.h1`       |
| `description` | `string?`                  | —       | Rendered in a `.py-2` > `<p>` wrapper        |
| `image`       | `FeatureAwarePictureProps` | —       | Passed to `FeatureAwarePicture` via `v-bind` |
| `padding`     | `boolean?`                 | `true`  | Whether outer `.container` gets `py-4`       |

##### 4.2.8.2 Default Slot

Injected after the description, before the image column. Used for
`LinkButtonGroup` (IndexPage) or GitHub profile link (SoftwaresPage).

##### 4.2.8.3 FeatureAwarePictureProps

Defined in `src/types/app.ts`. Props are passed through directly to
`FeatureAwarePicture` via `v-bind="image"`, except `width` / `height`
which are always overridden to `240` by `HeroSection`. Do **not** pass
`img-fluid` / `img-fit` in `image.class` — the fixed 240×240 box handles
sizing and CLS.

##### 4.2.8.4 Usage by Page

| Page             | `headingTag` | Slot              | `padding` |
| ---------------- | ------------ | ----------------- | --------- |
| About            | `h1`         | —                 | `true`    |
| Artworks         | `h1`         | —                 | `true`    |
| Softwares        | `h1`         | GitHub link       | `true`    |
| Blogs            | `h1`         | —                 | `true`    |
| Chatting         | `h1`         | —                 | `true`    |
| Copyright        | `h1`         | —                 | `true`    |
| Index (Blogs)    | `h2`         | `LinkButtonGroup` | `false`   |
| Index (Chatting) | `h2`         | `LinkButtonGroup` | `false`   |

IndexPage sub-sections use `headingTag="h2"` for SEO (page already has
an `<h1>`) and `:padding="false"` for compact spacing.

##### 4.2.8.5 IndexPage Inline Hero Sections (CLS)

IndexPage's illustration carousel and Softwares cover are **not**
`HeroSection` instances — they are inline `.large-hero-section` blocks
with responsive `w-100` square images. To keep them CLS-free, each image
is wrapped in a `.hero-cover-box`:

```css
.hero-cover-box {
  position: relative;
  width: 100%;
  padding-top: 100%; /* reserves a 1:1 box in all baseline browsers */
}
.hero-cover-box > .carousel,
.hero-cover-box > picture,
.hero-cover-box > img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.hero-cover-box > picture > img,
.hero-cover-box > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

> **Scoping is mandatory.** Use the `>` (direct child) selectors exactly
> as shown. A descendant selector (`.hero-cover-box picture`) also hits
> the `<picture>` elements _inside_ the carousel slides, removing them
> from flow and collapsing every `.carousel-item` to 0 height — which
> makes the whole carousel invisible.

The `padding-top` percentage technique (the same approach Bootstrap's
`.ratio` uses) reserves the square box **before** the image loads, so
lazy-loaded carousel slides and the Softwares cover cause zero layout
shift. No `img-fluid` / `img-fit` needed inside — sizing comes from the
box. This is preferred over the `aspect-ratio` CSS property, which is
not supported by the Safari 14 / Chrome 61 baseline.
