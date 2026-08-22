<!--
  PictureGroup.vue — Single picture-list group with heading, description,
  and a masonry grid of PictureCards (row-wise distribution).
-->
<script setup lang="ts">
import { toHtml } from "hast-util-to-html";
import { computed } from "vue";
import { useBreakpoint } from "../../composables/useBreakpoint";
import { useI18n } from "../../composables/useI18n";
import { resolveI18nInHtml } from "../../core/utils";
import type {
  Breakpoint,
  DisplayPictureData,
  DisplayPictureGroupData,
} from "../../types/app";
import SectionHeading from "../ui/SectionHeading.vue";
import PictureCard from "./PictureCard.vue";

// =========================================================================
// Constants
// =========================================================================

/** Column count per breakpoint tier for the masonry layout. */
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
  select: [picture: DisplayPictureData];
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const breakpoint = useBreakpoint();

/** HAST -> HTML for the group description (same handling as LinkCardGroup). */
const descHtml = computed(() =>
  props.group.description
    ? resolveI18nInHtml(
        toHtml(props.group.description as Parameters<typeof toHtml>[0]),
        t,
      )
    : "",
);

/** Whether the group has any pictures. */
const hasContents = computed(
  () => Array.isArray(props.group.contents) && props.group.contents.length > 0,
);

/**
 * Row-wise masonry columns: distribute contents round-robin into N column
 * arrays (`item i → column i % N`) so items read left-to-right row by row.
 */
const columns = computed<DisplayPictureData[][]>(() => {
  const count = COLUMN_COUNTS[breakpoint.value];
  const cols: DisplayPictureData[][] = Array.from({ length: count }, () => []);
  (props.group.contents ?? []).forEach((item, i) => {
    cols[i % count].push(item);
  });
  return cols;
});
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
    <p v-if="descHtml" class="card-text" v-html="descHtml"></p>

    <!-- Masonry grid -->
    <div v-if="hasContents" class="picture-columns">
      <div v-for="(col, ci) in columns" :key="ci" class="picture-column">
        <PictureCard
          v-for="item in col"
          :key="item.id"
          :picture="item"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Masonry columns (row-wise distribution, driven by JS) --- */
.picture-columns {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.picture-column {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
