<!--
  FeatureAwareImg.vue — <img> with multiple feature modes: theme-swap,
  colored mask, and loading opacity.

  Two usage modes:
  1. Vue template: <FeatureAwareImg light-src="..." dark-src="..." feature="colored" />
  2. Global scan: initAll() processes [data-img-feature] placeholders in the document
     (for build-time injected static HTML outside Vue's render tree).

  Features (via `feature` prop or data-img-feature attribute):
  - "follow-theme": auto-swap src between light/dark on theme change
  - "colored": CSS mask-based monochrome coloring
  - "loading-opacity": semi-transparent while loading, fade to opaque on load (always on)

  Replaces ui/img-utils.ts + stylesheets/components/img-utils.css.
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTheme } from "../../composables/useTheme.js";

// =========================================================================
// Props
// =========================================================================

const props = withDefaults(
  defineProps<{
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
  }>(),
  {
    darkSrc: undefined,
    feature: undefined,
    colorMaskSrc: undefined,
    colorVar: undefined,
    alt: "",
    width: undefined,
    height: undefined,
    class: undefined,
  },
);

// =========================================================================
// Theme-aware src
// =========================================================================

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

// =========================================================================
// Loading opacity
// =========================================================================

const loaded = ref(false);

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

// =========================================================================
// Colored mask setup
// =========================================================================

const imgRef = ref<HTMLImageElement>();

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

// =========================================================================
// Feature list for data attributes
// =========================================================================

const featureAttr = computed(() => props.feature || undefined);

// =========================================================================
// Global scan: process all [data-img-feature] placeholders
// =========================================================================

function applyColoredImage(img: HTMLImageElement): void {
  const maskSrc = img.getAttribute("data-src-mask");
  if (maskSrc) {
    img.style.setProperty("--img-mask-url", `url(${maskSrc})`);
  }
  const cv = img.getAttribute("data-color-var");
  if (cv) {
    img.style.setProperty("--img-color", `var(--${cv})`);
  }
}

function initAllColoredImages(): void {
  document
    .querySelectorAll<HTMLImageElement>('img[data-img-feature~="colored"]')
    .forEach(applyColoredImage);
}

function initImageLoadingOpacity(img: HTMLImageElement): void {
  if (img.matches('[data-img-feature~="colored"]')) return;
  if (img.complete && img.naturalWidth > 0) {
    img.setAttribute("data-img-loaded", "");
  } else {
    img.addEventListener(
      "load",
      () => img.setAttribute("data-img-loaded", ""),
      { once: true },
    );
    img.addEventListener(
      "error",
      () => img.setAttribute("data-img-loaded", ""),
      { once: true },
    );
  }
}

function initAllImageLoadingOpacity(): void {
  document
    .querySelectorAll<HTMLImageElement>("img")
    .forEach(initImageLoadingOpacity);
}

async function initAll(): Promise<void> {
  initAllColoredImages();
  initAllImageLoadingOpacity();
}

defineExpose({ initAll, initAllColoredImages, initAllImageLoadingOpacity });
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
