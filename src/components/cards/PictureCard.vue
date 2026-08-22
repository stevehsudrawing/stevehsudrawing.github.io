<!--
  PictureCard.vue — Single gallery picture card (masonry item).
  Renders a FeatureAwarePicture poster with the preview-only no-copy
  treatment.  Click-to-open-lightbox is wired in Phase 2.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import type {
  DisplayPictureData,
  FeatureAwarePictureProps,
} from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Props / Emits
// =========================================================================

const props = defineProps<{
  /** Picture data from the picture-list JSON config. */
  picture: DisplayPictureData;
}>();

const emit = defineEmits<{
  /** Fired when the card is activated (click / Enter / Space). */
  select: [picture: DisplayPictureData];
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

/** Resolved alt text — explicit alt or i18n fallback from the id. */
const alt = computed(
  () => props.picture.pictureProps.alt ?? t("text-" + props.picture.id),
);

/** Resolved FeatureAwarePicture props (alt, lazy loading, no-copy class). */
const imgProps = computed<FeatureAwarePictureProps>(() => {
  const base = props.picture.pictureProps;
  const baseClass = typeof base.class === "string" ? base.class : "";
  return {
    ...base,
    alt: alt.value,
    loading: "lazy",
    class: [baseClass, "no-copy", "picture-card-img"].filter(Boolean).join(" "),
  };
});

// =========================================================================
// Actions
// =========================================================================

/** Open the lightbox for this picture (Phase 2). */
function onActivate(): void {
  emit("select", props.picture);
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
  transition: outline 0.1s ease-in-out;
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
