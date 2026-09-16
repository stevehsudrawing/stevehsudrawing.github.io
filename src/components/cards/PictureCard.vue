<!--
  PictureCard.vue — Single gallery picture card (masonry item).
  Renders a FeatureAwarePicture poster with the preview-only no-copy
  treatment.  The picture's props are resolved through the registry; the
  card supplies the card-layer display keys only.
-->
<script setup lang="ts">
import { computed } from "vue";
import { usePictureRegistry } from "../../composables/usePictureRegistry";
import type { FeatureAwarePictureProps } from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Props / Emits
// =========================================================================

const props = defineProps<{
  /** Picture id from the group pool. */
  pictureId: string;
  /** Owning group id (carried by the `select` event). */
  groupId: string;
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
    loading: "lazy",
    class: "no-copy picture-card-img",
  }),
);

/** Alt text (also the figure's aria-label). */
const alt = computed(() => imgProps.value.alt ?? "");

// =========================================================================
// Actions
// =========================================================================

/** Open the lightbox for this picture. */
function onActivate(): void {
  emit("select", props.pictureId, props.groupId);
}
</script>

<template>
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
</template>

<style scoped>
/* --- Masonry card --- */
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
.picture-card :deep(.picture-card-img) {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--bs-border-radius);
}
</style>
