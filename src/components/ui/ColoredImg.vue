<!--
  ColoredImg.vue — CSS mask + tint image rendering.

  Renders a plain <img> with data-img-feature="colored" and
  --img-color / --img-mask-url CSS custom properties.
  Extracted from FeatureAwareImg.vue to decouple the fundamentally
  different rendering approach (CSS mask) from feature-driven
  src-switching (follow-theme / follow-language).

  Props = ColoredImgProps in types/app.ts (single source of truth).
-->
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { ColoredImgProps } from "../../types/app";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<ColoredImgProps>();

// =========================================================================
// State
// =========================================================================

const loaded = ref(false);
const imgRef = ref<HTMLImageElement>();

// -------------------------------------------------------------------------
// Inline style
// -------------------------------------------------------------------------

const inlineStyle = computed(() => {
  const style: Record<string, string> = {};
  style["--img-color"] = `var(--${props.colorVar})`;
  style["--img-mask-url"] = `url(${props.src})`;
  return style;
});

// =========================================================================
// Actions
// =========================================================================

function onLoad(): void {
  loaded.value = true;
}

function onError(): void {
  loaded.value = true;
}

onMounted(() => {
  if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    loaded.value = true;
  }
});
</script>

<template>
  <img
    ref="imgRef"
    src="/images/webp/null.webp"
    :alt="alt"
    :width="width"
    :height="height"
    :class="class"
    :loading="loading"
    data-img-feature="colored"
    :data-img-loaded="loaded ? '' : undefined"
    :style="inlineStyle"
    @load="onLoad"
    @error="onError"
  />
</template>

<style scoped>
/* ==== Colored mask-based icons ==== */

[data-img-feature~="colored"] {
  background-color: var(--img-color, var(--bs-body-color));
  mask: var(--img-mask-url, none) no-repeat center / contain;
  -webkit-mask: var(--img-mask-url, none) no-repeat center / contain;
}

/* ==== Loading opacity ==== */

img {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  cursor: wait;
}

img[data-img-loaded] {
  opacity: 1;
  cursor: inherit;
}
</style>
