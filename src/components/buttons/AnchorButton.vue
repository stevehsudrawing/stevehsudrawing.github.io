<!--
  AnchorButton.vue — Heading anchor link with tooltip.
  Renders <a href="#targetId"> with the paragraph icon, linking
  to a specific heading section on the page with a smooth scroll
  and 64 px navbar offset.

  Replaces the <a class="title-link-anchor"> + data-bs-toggle="tooltip"
  pattern previously handled by ui/accessibility.ts + ui/tooltips.ts.
-->
<script setup lang="ts">
import { scrollToHashTarget } from "../../platform/accessibility";
import TooltipTrigger from "../ui/TooltipTrigger.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Target heading id (without the leading #). */
  targetId: string;
  /**
   * Human-readable heading title, used for an accessible
   * aria-label (e.g. "Anchor to Profile").
   */
  headingTitle: string;
}>();

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// Click Handler
// -------------------------------------------------------------------------

function onClick(targetId: string): void {
  const hash = `#${targetId}`;
  history.pushState(null, "", hash);
  scrollToHashTarget(hash);
}
</script>

<template>
  <TooltipTrigger :title="$t('text-anchor')" teleport>
    <a
      class="link title-link-anchor"
      :href="`#${targetId}`"
      :aria-label="$t('text-anchor-to-x', [props.headingTitle])"
      @click.prevent="onClick(targetId)"
    >
      <i class="bi bi-paragraph"></i>
    </a>
  </TooltipTrigger>
</template>
