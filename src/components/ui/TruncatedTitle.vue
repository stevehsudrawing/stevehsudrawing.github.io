<!--
  TruncatedTitle.vue — single-line modal title with a truncation tooltip.

  Clamps the title to one line with an ellipsis and re-measures it
  (ResizeObserver + a text watcher).  While the text actually overflows,
  the component joins the tab order and mounts through `TooltipTrigger`
  — hover or keyboard focus then reveals the full text; a short title
  stays a plain, non-tabbable line.

  Sits in the BModal `#title` slot of every modal; the outer
  `.modal-title` span (including the `-label` id that `aria-labelledby`
  points at) stays BModal's, and the companion clamp rule lives in
  `stylesheets/base.css`.
-->
<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from "vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// Types
// =========================================================================

/** Public props of `TruncatedTitle`. */
interface TruncatedTitleProps {
  /** The full title text — the visible line and the tooltip share it. */
  text: string;
}

// =========================================================================
// Props
// =========================================================================

const props = defineProps<TruncatedTitleProps>();

// =========================================================================
// State
// =========================================================================

/** The visible title element (`null` between branch swaps). */
const el = ref<HTMLElement | null>(null);

/** Whether the text currently overflows its box. */
const truncated = ref(false);

// =========================================================================
// Actions
// =========================================================================

/** Re-measure the element and update `truncated`. */
function measure(): void {
  const node = el.value;
  if (!node) return;
  truncated.value = node.scrollWidth > node.clientWidth;
}

/** Observer handle, re-targeted whenever the element is (re)created. */
let observer: ResizeObserver | null = null;

// The template swaps the `TooltipTrigger` wrapper when `truncated`
// flips, so the element is re-created — re-attach on every change.
watch(
  el,
  (node) => {
    observer?.disconnect();
    observer = null;
    if (node) {
      observer = new ResizeObserver(measure);
      observer.observe(node);
    }
    measure();
  },
  { flush: "post" },
);

// Text changes (language switch, another picture) need a fresh measure.
watch(
  () => props.text,
  () => nextTick(measure),
);

onUnmounted(() => observer?.disconnect());
</script>

<template>
  <TooltipTrigger v-if="truncated" :title="text">
    <span ref="el" class="truncated-title" tabindex="0">{{ text }}</span>
  </TooltipTrigger>
  <span v-else ref="el" class="truncated-title">{{ text }}</span>
</template>

<style scoped>
/* The block span owns the ellipsis; its width follows the outer
   `.modal-title` flex item (clamped by the global rule in base.css). */
.truncated-title {
  display: block;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
