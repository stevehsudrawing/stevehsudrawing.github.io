<!--
  AnchorButton.vue -- Heading anchor link with tooltip.
  Renders <a href="#targetId"> with the paragraph icon, linking
  to a specific heading section on the page.

  Replaces the <a class="title-link-anchor"> + data-bs-toggle="tooltip"
  pattern previously handled by ui/accessibility.ts + ui/tooltips.ts.
-->
<script setup lang="ts">
defineProps<{
  /** Target heading id (without the leading #). */
  targetId: string;
  /** Accessible label (e.g. "Link to Profile"). */
  buttonAriaLabel: string;
}>();
</script>

<template>
  <a
    class="link title-link-anchor"
    :href="`#${targetId}`"
    :aria-label="buttonAriaLabel"
    v-b-tooltip="$t('text-anchor', 'Anchor')"
  >
    <i class="bi bi-paragraph"></i>
  </a>
</template>
