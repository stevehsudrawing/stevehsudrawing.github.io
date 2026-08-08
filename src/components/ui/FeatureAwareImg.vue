<!--
  FeatureAwareImg.vue — <img> with multiple feature modes: theme-swap,
  colored mask, and loading opacity.

  Props: lightSrc, darkSrc?, feature?, colorMaskSrc?, colorVar?, alt?, width?, height?, class?

  Replaces ui/img-utils.ts + stylesheets/components/img-utils.css.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTheme } from "../../composables/useTheme";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Light-mode image source. */
  lightSrc: string;
  /** Dark-mode image source (falls back to lightSrc). */
  darkSrc?: string;
  /** Space-separated features: "follow-theme" "colored" */
  feature?: string;
  /** Mask image for colored mode (data-src-mask). */
  colorMaskSrc?: string;
  /** CSS variable name for colored mode (data-color-var). */
  colorVar?: string;
  /** HTML alt attribute. */
  alt?: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
  /** Additional CSS classes. */
  class?: string;
}>();

// =========================================================================
// State
// =========================================================================

// -------------------------------------------------------------------------
// Theme-aware src
// -------------------------------------------------------------------------

const { effectiveTheme } = useTheme();

const currentSrc = computed(() => {
  if (
    props.feature?.includes("follow-theme") &&
    effectiveTheme.value === "dark" &&
    props.darkSrc
  ) {
    return props.darkSrc;
  }
  return props.lightSrc;
});

// -------------------------------------------------------------------------
// Loading opacity
// -------------------------------------------------------------------------

const loaded = ref(false);
const imgRef = ref<HTMLImageElement>();

// -------------------------------------------------------------------------
// Colored mask
// -------------------------------------------------------------------------

const maskStyle = computed(() => {
  if (!props.feature?.includes("colored")) return {};
  const style: Record<string, string> = {};
  if (props.colorVar) {
    style["--img-color"] = `var(--${props.colorVar})`;
  }
  if (props.colorMaskSrc) {
    style["--img-mask-url"] = `url(${props.colorMaskSrc})`;
  }
  return style;
});

const featureAttr = computed(() => props.feature || undefined);

// =========================================================================
// Actions
// =========================================================================

function onLoad(): void {
  loaded.value = true;
}

function onError(): void {
  loaded.value = true; // Mark as loaded even on error to remove spinner cursor
}

// Check if already loaded (browser cache)
onMounted(() => {
  if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    loaded.value = true;
  }
});
</script>

<template>
  <img
    ref="imgRef"
    :src="currentSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :class="class"
    :data-img-feature="featureAttr"
    :data-img-loaded="loaded ? '' : undefined"
    :style="maskStyle"
    @load="onLoad"
    @error="onError"
  />
</template>

<style>
/* ==== Image Utilities — data-img-feature based styling ==== */

/* --- Image loading opacity --- */

img {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  cursor: wait;
}

img[data-img-loaded],
img[data-img-feature~="colored"] {
  opacity: 1;
  cursor: inherit;
}

/* --- Colored mask-based icons --- */

[data-img-feature~="colored"] {
  background-color: var(--img-color, var(--bs-body-color));
  mask: var(--img-mask-url, none) no-repeat center / contain;
  -webkit-mask: var(--img-mask-url, none) no-repeat center / contain;
}
</style>
