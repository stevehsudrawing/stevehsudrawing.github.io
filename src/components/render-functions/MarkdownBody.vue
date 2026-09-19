<!--
  MarkdownBody.vue — renders a markdown string through the shared
  `markdownToHast()` pipeline (marked -> HAST -> HastFragment).

  Kept as a standalone component so consumers can load it through
  `defineAsyncComponent`: the markdown parser stack (marked +
  hast-util-from-html, ≈240 KB raw) then stays out of the entry
  chunk — the changelog modal pays for it only when the first commit
  body renders.  `MarkdownArticle` shares the same pipeline.
-->
<script setup lang="ts">
import { computed } from "vue";
import { markdownToHast } from "../../core/markdown";
import type { HastNode } from "../../types/hast";
import HastFragment from "./HastFragment.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Raw markdown source. */
  markdown: string;
}>();

// =========================================================================
// State
// =========================================================================

/** HAST children for the HastFragment recursive renderer. */
const nodes = computed<HastNode[]>(
  () => markdownToHast(props.markdown).children ?? [],
);
</script>

<template>
  <HastFragment :nodes="nodes" />
</template>
