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

#### 4.2.9 Hero Section

`HeroSection.vue` replaces ~15 lines of repetitive HTML across 8 hero
sections on 7 pages. It renders a heading, description, and cover image
in a responsive two-column flex layout.

##### 4.2.9.1 Props

| Prop          | Type             | Default | Notes                                        |
| ------------- | ---------------- | ------- | -------------------------------------------- |
| `title`       | `string`         | --      | Pre-resolved i18n text                       |
| `headingTag`  | `"h1" \| "h2"`   | `"h1"`  | Semantic tag; always styled with `.h1`       |
| `description` | `string?`        | --      | Rendered in a `.py-2` > `<p>` wrapper        |
| `image`       | `HeroImageProps` | --      | Passed to `FeatureAwarePicture` via `v-bind` |
| `padding`     | `boolean?`       | `true`  | Whether outer `.container` gets `py-4`       |

##### 4.2.9.2 Default Slot

Injected after the description, before the image column. Used for
`LinkButtonGroup` (IndexPage) or GitHub profile link (SoftwaresPage).

##### 4.2.9.3 HeroImageProps

Defined in `src/types/app.ts`. Props mirror `FeatureAwarePicture` so
the component can use `v-bind="image"` to pass them through directly.

##### 4.2.9.4 Usage by Page

| Page             | `headingTag` | Slot              | `padding` |
| ---------------- | ------------ | ----------------- | --------- |
| About            | `h1`         | --                | `true`    |
| Artworks         | `h1`         | --                | `true`    |
| Softwares        | `h1`         | GitHub link       | `true`    |
| Blogs            | `h1`         | --                | `true`    |
| Chatting         | `h1`         | --                | `true`    |
| Copyright        | `h1`         | --                | `true`    |
| Index (Blogs)    | `h2`         | `LinkButtonGroup` | `false`   |
| Index (Chatting) | `h2`         | `LinkButtonGroup` | `false`   |

IndexPage sub-sections use `headingTag="h2"` for SEO (page already has
an `<h1>`) and `:padding="false"` for compact spacing.
