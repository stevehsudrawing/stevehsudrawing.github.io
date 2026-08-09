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
import { useDelayedTooltip } from "../../composables/useDelayedTooltip";

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

// ---- Tooltip ----

const anchorTip = useDelayedTooltip(500);

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
  <a
    class="link title-link-anchor"
    :href="`#${targetId}`"
    :aria-label="$t('text-anchor-to-1', 'Anchor to %1', [props.headingTitle])"
    v-b-tooltip.top.manual="{
      modelValue: anchorTip.visible,
      title: $t('text-anchor', 'Anchor'),
      teleportTo: 'body',
    }"
    @mouseenter="anchorTip.scheduleShow()"
    @mouseleave="anchorTip.cancelAndHide()"
    @click.prevent="onClick(targetId)"
  >
    <i class="bi bi-paragraph"></i>
  </a>
</template>
