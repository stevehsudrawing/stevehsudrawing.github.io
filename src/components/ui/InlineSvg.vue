<!--
  InlineSvg.vue — fetches external SVGs and injects them inline.

  Two usage modes:
  1. Vue template: <InlineSvg src="..." :width="25" :height="21" color-var="bs-primary" />
  2. Global scan: initAll() processes all [data-role="svg"] placeholders in the document
     (for build-time injected static HTML outside Vue's render tree).

  Replaces ui/svg-utils.ts.
-->
<script setup lang="ts">
import { ref, onMounted } from "vue";

// =========================================================================
// Props (Vue template mode)
// =========================================================================

const props = defineProps<{
  src: string;
  width?: number;
  height?: number;
  colorVar?: string;
}>();

const containerRef = ref<HTMLElement>();

// =========================================================================
// Core: fetch + process + inject
// =========================================================================

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

    // Replace fill="currentColor" with the specified CSS variable
    if (colorVar) {
      svgText = svgText.replace(
        /fill="currentColor"/g,
        `fill="var(--${colorVar})"`,
      );
    }

    // Set width and height
    if (width || height) {
      svgText = svgText.replace(
        /<svg /,
        `<svg width="${width ?? ""}" height="${height ?? ""}" `,
      );
    } else {
      // Remove hardcoded dimensions so the SVG scales with its container
      svgText = svgText.replace(/<svg /, `<svg `);
    }

    placeholder.innerHTML = svgText;
  } catch (error) {
    console.error(`Failed to inject SVG: ${svgSrc}`, error);
  }
}

// =========================================================================
// Vue template mode: render self
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

// =========================================================================
// Global scan: process all [data-role="svg"] placeholders
// =========================================================================

async function initAll(): Promise<void> {
  const placeholders =
    document.querySelectorAll<HTMLElement>('[data-role="svg"]');

  for (const placeholder of placeholders) {
    const src = placeholder.getAttribute("data-src");
    if (!src) continue;

    const w = placeholder.getAttribute("data-width");
    const h = placeholder.getAttribute("data-height");
    const c = placeholder.getAttribute("data-color-var");

    await injectSVG(
      placeholder,
      src,
      w ? Number(w) : undefined,
      h ? Number(h) : undefined,
      c ?? undefined,
    );
  }
}

defineExpose({ initAll });
</script>

<template>
  <span ref="containerRef" />
</template>
