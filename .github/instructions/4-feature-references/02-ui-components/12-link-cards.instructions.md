---
description: >
  Link Cards: LinkCard.vue (single card), LinkCardGroup.vue (section with heading),
  LinkCardGroups.vue (page container), useLinkCards.ts (JSON config loader).
  Use when: modifying link-card rendering, JSON config format, or card-group layout.
applyTo: >
  src/components/cards/LinkCard.vue;
  src/components/cards/LinkCardGroup.vue;
  src/components/cards/LinkCardGroups.vue;
  src/composables/useLinkCards.ts;
  src/configs/link-cards/**
---

#### 4.2.12 Link Cards

##### 4.2.12.1 Architecture

```
useLinkCards(pageName: Ref)
  └─ loads src/configs/link-cards/{pageName}.json (lazy import)
  └─ returns { groups, pagePath }

LinkCardGroups.vue
  ├─ receives :groups, :page-path
  └─ renders each group as LinkCardGroup

LinkCardGroup.vue
  ├─ SectionHeading + group-level scrollspy anchor
  └─ renders each card as LinkCard

LinkCard.vue
  ├─ Props: { card: CardData }
  ├─ Icon:    extractPictureProps / extractColoredImgProps → FeatureAwarePicture / ColoredImg
  ├─ Title:   extractLinkProps → TypeAwareLink
  └─ Description: HastFragment
```

##### 4.2.12.2 JSON Config Format

See `src/configs/link-cards/{pageName}.json`. Each file is a JSON array of
`GroupData[]`. Groups contain cards; each card has `icon`, `title`, and
`description` as HAST subtrees.

##### 4.2.12.3 Usage

```vue
<script setup>
const { groups, pagePath } = useLinkCards(ref("softwares"));
</script>
<template>
  <LinkCardGroups :groups="groups" :page-path="pagePath" />
</template>
```

> `BASE_URL` lives in `src/core/page-meta.ts` — `LinkCardGroups` /
> `LinkCardGroup` / `SectionHeading` import it directly for copy-link URL
> generation; pages do not need to pass it as a prop.
