<!--
  PictureCard.vue — Single gallery picture card (grid cell).
  Renders a FeatureAwarePicture poster with the preview-only no-copy
  treatment.  The picture's props are resolved through the registry; the
  card supplies the card-layer display keys only.
-->
<script setup lang="ts">
import { computed } from "vue";
import { usePictureRegistry } from "../../composables/usePictureRegistry";
import type { FeatureAwarePictureProps } from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// Props / Emits
// =========================================================================

const props = defineProps<{
  /** Picture id from the group pool. */
  pictureId: string;
  /** Owning group id (carried by the `select` event). */
  groupId: string;
  /** Uniform group ratio — the reserved placeholder box (width ÷ height). */
  aspectRatio: number;
}>();

const emit = defineEmits<{
  /** Fired when the card is activated (click / Enter / Space). */
  select: [pictureId: string, groupId: string];
}>();

// =========================================================================
// State
// =========================================================================

const { pictureProps } = usePictureRegistry();

/** Resolved FeatureAwarePicture props (registry + card display keys). */
const imgProps = computed<FeatureAwarePictureProps>(() =>
  pictureProps(props.pictureId, {
    aspectRatio: props.aspectRatio,
    loading: "lazy",
    class: "no-copy picture-card-img",
  }),
);

/** Alt text (also the figure's aria-label). */
const alt = computed(() => imgProps.value.alt ?? "");

/** Tooltip title — the resolved picture title; empty hides the tooltip. */
const titleText = computed(() => imgProps.value.title ?? "");

// =========================================================================
// Actions
// =========================================================================

/** Open the lightbox for this picture. */
function onActivate(): void {
  emit("select", props.pictureId, props.groupId);
}
</script>

<template>
  <!--
    The cell div is the grid item.  The b-tooltip directive mounts a
    host <span> NEXT TO its target (the figure) — as a direct grid
    child that span claims a cell of its own and leaves every other
    cell empty (v3.18.4 fix).  The block cell confines it.
  -->
  <div class="picture-card-cell">
    <TooltipTrigger v-if="titleText" :title="titleText">
      <figure
        class="picture-card"
        role="button"
        tabindex="0"
        :aria-label="alt"
        @click="onActivate"
        @keydown.enter="onActivate"
        @keydown.space.prevent="onActivate"
      >
        <FeatureAwarePicture v-bind="imgProps" />
      </figure>
    </TooltipTrigger>
    <figure
      v-else
      class="picture-card"
      role="button"
      tabindex="0"
      :aria-label="alt"
      @click="onActivate"
      @keydown.enter="onActivate"
      @keydown.space.prevent="onActivate"
    >
      <FeatureAwarePicture v-bind="imgProps" />
    </figure>
  </div>
</template>

<style scoped>
/* --- Grid cell (confines the tooltip host span; see the template) --- */
.picture-card-cell {
  min-width: 0;
}

/* --- Grid card --- */
.picture-card {
  margin: 0;
  width: 100%;
  cursor: pointer;
  outline: 0 solid var(--bs-body-color);
  transition: outline var(--shlh-duration-fast) ease-in-out;
}

.picture-card:hover {
  outline: 2px solid var(--bs-body-color);
}

/* --- Poster image (fills the column, height auto) --- */

/* The unified wrapper (v3.18.1) must take the full column width — an
   inline-block shrink-to-fit wrapper collapses while a lazy image has
   no intrinsic size yet (the img's `width: 100%` has nothing to resolve
   against, so the reserved `aspect-ratio` box would not apply). */
.picture-card :deep(.feature-aware-picture) {
  display: block;
  width: 100%;
}

.picture-card :deep(.picture-card-img) {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--bs-border-radius);
}
</style>
