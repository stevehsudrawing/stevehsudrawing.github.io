<!--
  PictureListGroups.vue — Page-level picture-list section.
  Iterates over DisplayPictureGroupData[] from the picture-list JSON config
  and renders each group with <hr> separators between them.
-->
<script setup lang="ts">
import PictureGroup from "./PictureGroup.vue";
import type {
  DisplayPictureData,
  DisplayPictureGroupData,
} from "../../types/app";

// =========================================================================
// Props / Emits
// =========================================================================

defineProps<{
  /** All picture groups for this page. */
  groups: DisplayPictureGroupData[];
  /** Page path for anchor/copy-link URL generation (e.g. "/gallery.html"). */
  pagePath: string;
}>();

const emit = defineEmits<{
  /** Fired when a picture card is activated. */
  select: [picture: DisplayPictureData];
}>();
</script>

<template>
  <template v-for="(group, idx) in groups" :key="idx">
    <hr v-if="idx > 0" />
    <PictureGroup
      :group="group"
      :page-path="pagePath"
      @select="emit('select', $event)"
    />
  </template>
</template>
