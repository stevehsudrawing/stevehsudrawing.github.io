<!--
  InlineSvg.vue -- fetches an external SVG and injects it inline.

  Props: src, width?, height?, colorVar?
  Global scan: useSvgInjection.ts (composable).

  Replaces ui/svg-utils.ts.
-->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { injectSVG } from "../../composables/useSvgInjection.js";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  src: string;
  width?: number;
  height?: number;
  colorVar?: string;
}>();

// =========================================================================
// State
// =========================================================================

const containerRef = ref<HTMLElement>();

// =========================================================================
// Actions
// =========================================================================

onMounted(async () => {
  if (containerRef.value && props.src) {
    await injectSVG(
      containerRef.value,
      props.src,
      props.width,
      props.height,
      props.colorVar,
    );
  }
});
</script>

<template>
  <span ref="containerRef" />
</template>
