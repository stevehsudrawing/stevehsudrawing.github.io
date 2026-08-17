---
description: >
  Picture List: PictureCard.vue (masonry item), PictureGroup.vue (section with
  heading + row-wise masonry), PictureListGroups.vue (page container),
  usePictureList.ts (JSON config loader).  Masonry uses JS round-robin column
  distribution (row-wise ordering) driven by useBreakpoint().
  Use when: modifying gallery rendering, picture-list JSON config, or masonry layout.
applyTo: >
  src/components/cards/PictureCard.vue;
  src/components/cards/PictureGroup.vue;
  src/components/cards/PictureListGroups.vue;
  src/composables/usePictureList.ts;
  src/configs/picture-list/**
---

#### 4.2.15 Picture List

##### 4.2.15.1 Architecture

```
usePictureList(pageName: Ref)
  └─ loads src/configs/picture-list/{pageName}.json (lazy import)
  └─ returns { groups, pagePath }

PictureListGroups.vue
  ├─ receives :groups, :page-path
  └─ renders each group as PictureGroup (with <hr> separators)

PictureGroup.vue
  ├─ SectionHeading (:title="t('text-' + group.id)", :heading-id="group.id")
  ├─ Description: v-html + resolveI18nInHtml + toHtml (like LinkCardGroup)
  └─ Masonry: columns = round-robin contents into COLUMN_COUNTS[breakpoint]

PictureCard.vue
  └─ Props: { picture: DisplayPictureData }
  └─ FeatureAwarePicture with alt = pictureProps.alt ?? t("text-" + id),
     loading="lazy", class="no-copy solid-bg picture-card-img"
```

##### 4.2.15.2 JSON Config Format

See `src/configs/picture-list/{pageName}.json` and the type definitions
[§3.3.5](../3-project-structural-constraints/3-type-definitions.instructions.md#335-picture-list-json-format-srcconfigspicture-listjson).

- Group `id` = i18n key suffix for the heading (`t("text-" + id)`) and the
  stable anchor id. Picture `id` = i18n alt suffix + lightbox deep-link target
  (`?preview=<id>`).
- Naming: individual series are **singular**
  (`sticker-collection-series-1-vol-1`); the collective group is **plural**
  (`sticker-collections`).

##### 4.2.15.3 Masonry: row-wise distribution

- Column count per breakpoint (`COLUMN_COUNTS` in `PictureGroup.vue`):
  `mobile` 2 / `tablet` 3 / `desktop` 4 / `wide-desktop` 6.
- Items are distributed round-robin (`item i → column i % N`) so they read
  left-to-right row by row. CSS multi-column (`column-count`) is NOT used —
  it fills each column top-to-bottom (vertical ordering).
- Each column is a `flex-direction: column` div with a gutter; poster images
  get `width: 100%` and auto height, so varying aspect ratios produce the
  waterfall effect.

##### 4.2.15.4 Preview-only constraint

Gallery posters are original artworks (see
[public/images/README.md](../../../../public/images/README.md)). Images use
`.no-copy` (blocks `user-select`, context menu, and drag) and no download
controls are provided.

##### 4.2.15.5 Usage

```vue
<script setup>
const { groups, pagePath } = usePictureList(ref("gallery"));
</script>
<template>
  <PictureListGroups :groups="groups" :page-path="pagePath" />
</template>
```
