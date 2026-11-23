<!--
  PictureGroup.vue — Single picture-list group with heading, description,
  and a CSS Grid of PictureCards (row-wise flow, v3.18.4).
-->
<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../../composables/core/useBreakpoint";
import { useI18n } from "../../composables/core/useI18n";
import type { Breakpoint, DisplayPictureGroupData } from "../../types/app";
import type { HastNode } from "../../types/hast";
import HastFragment from "../render-functions/HastFragment.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import PictureCard from "./PictureCard.vue";

// =========================================================================
// Constants
// =========================================================================

/** Column count per breakpoint tier for the grid layout. */
const COLUMN_COUNTS: Record<Breakpoint, number> = {
  mobile: 2,
  tablet: 3,
  desktop: 4,
  "wide-desktop": 6,
};

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Group data from the picture-list JSON config. */
  group: DisplayPictureGroupData;
  /** Page path for anchor/copy-link URL generation (e.g. "/gallery.html"). */
  pagePath: string;
}>();

const emit = defineEmits<{
  /** Fired when a picture card is activated. */
  select: [pictureId: string, groupId: string];
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const breakpoint = useBreakpoint();

/** HAST children for the group description. */
const descNodes = computed<HastNode[]>(() => {
  if (!props.group.description) return [];
  const desc = props.group.description;
  return desc.type === "root" && Array.isArray(desc.children)
    ? (desc.children as HastNode[])
    : [desc as HastNode];
});

/** Whether the group has any pictures. */
const hasContents = computed(
  () => Array.isArray(props.group.contents) && props.group.contents.length > 0,
);
</script>

<template>
  <div>
    <!-- ==== Group header ==== -->
    <SectionHeading
      :title="t('text-' + props.group.id)"
      :heading-id="props.group.id"
      :page-path="props.pagePath"
    />

    <!-- Group description -->
    <p v-if="descNodes.length" class="card-text">
      <HastFragment :nodes="descNodes" />
    </p>

    <!-- Grid (row-major; the uniform group ratio keeps rows tidy) -->
    <div
      v-if="hasContents"
      class="picture-grid"
      :style="{ '--picture-columns': COLUMN_COUNTS[breakpoint] }"
    >
      <PictureCard
        v-for="itemId in props.group.contents"
        :key="itemId"
        :picture-id="itemId"
        :group-id="props.group.id"
        :aspect-ratio="props.group.aspectRatio"
        @select="emit('select', $event, props.group.id)"
      />
    </div>
  </div>
</template>

<style scoped>
/* --- Grid (per-breakpoint column count; row-major order) --- */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(var(--picture-columns), minmax(0, 1fr));
  gap: 2px;
}
</style>
