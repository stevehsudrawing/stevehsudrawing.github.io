<!--
  InlineSvg.vue — fetches an external SVG and injects it inline.

  Props: src, width?, height?, colorVar?

  Replaces ui/svg-utils.ts and composables/useSvgInjection.ts.
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";

// =========================================================================
// Helpers (module-level — shared across component instances)
// =========================================================================

/**
 * Fetch, process, and inject a single SVG into a placeholder element.
 * @param placeholder — The DOM element to receive the inline SVG.
 * @param svgSrc — URL of the SVG file to fetch.
 * @param width — Optional width override (in px).
 * @param height — Optional height override (in px).
 * @param colorVar — Optional CSS variable name for fill replacement.
 */
async function injectSVG(
  placeholder: HTMLElement,
  svgSrc: string,
  width?: number,
  height?: number,
  colorVar?: string,
): Promise<void> {
  if (placeholder.querySelector("svg")) return; // already injected

  try {
    const response = await fetch(svgSrc);
    if (!response.ok) {
      console.error(`Failed to load SVG: ${svgSrc} (${response.status})`);
      return;
    }

    let svgText = await response.text();

    if (colorVar) {
      svgText = svgText.replace(
        /fill="currentColor"/g,
        `fill="var(--${colorVar})"`,
      );
    }

    if (width || height) {
      svgText = svgText.replace(
        /<svg /,
        `<svg width="${width ?? ""}" height="${height ?? ""}" `,
      );
    } else {
      svgText = svgText.replace(/<svg /, `<svg `);
    }

    placeholder.innerHTML = svgText;
  } catch (error) {
    console.error(`Failed to inject SVG: ${svgSrc}`, error);
  }
}

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
