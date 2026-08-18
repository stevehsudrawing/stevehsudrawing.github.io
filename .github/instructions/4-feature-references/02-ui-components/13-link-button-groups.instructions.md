---
description: >
  Link Button Groups: LinkButton.vue (single button), LinkButtonGroup.vue
  (horizontal scrollable group with integrated ScrollHint), useLinkButtonGroups.ts
  (JSON config loader).
  Use when: modifying link-button rendering, JSON config format, or scroll hint behavior.
applyTo: >
  src/components/buttons/LinkButton.vue;
  src/components/buttons/LinkButtonGroup.vue;
  src/composables/useLinkButtonGroups.ts;
  src/configs/link-button-groups/**
---

#### 4.2.13 Link Button Groups

##### 4.2.13.1 Architecture

```
useLinkButtonGroups(pageName: Ref)
  └─ loads src/configs/link-button-groups/{pageName}.json (lazy import)
  └─ returns { groups }

LinkButtonGroup.vue
  ├─ receives :group (LinkButtonGroupData)
  ├─ renders each button as LinkButton
  └─ integrated ScrollHint (horizontal overflow indicator)

LinkButton.vue
  ├─ Props: { button: LinkButtonData }
  └─ Renders TypeAwareLink (button.link) + TypeAwareImage (button.icon)
```

##### 4.2.13.2 JSON Config Format

See `src/configs/link-button-groups/{groupName}.json`. Each file is a JSON
array of `LinkButtonGroupData[]`. Groups have `groupId` + `buttons`. Buttons
have `id`, `link` (`TypeAwareLinkProps`), `icon` (`TypeAwareImageProps`), and
optional `primary` / `sameAs`. Tooltip and icon alt resolve from
`t("text-" + id)`. See [§3.3.4](../3-project-structural-constraints/3-type-definitions.instructions.md#334-link-button-group-json-format-srcconfigslink-button-groupsjson).

##### 4.2.13.3 Scroll Hint

Horizontal scroll hint (`.scroll-hint`) is integrated into `LinkButtonGroup.vue`
— no separate bridge file. The hint toggles visibility based on
`scrollWidth > clientWidth` via `resize` listener with `requestAnimationFrame`
throttle.

##### 4.2.13.4 Usage

```vue
<script setup>
const { groups } = useLinkButtonGroups(ref("index"));
</script>
<template>
  <LinkButtonGroup v-for="g in groups" :key="g.id" :group="g" />
</template>
```
