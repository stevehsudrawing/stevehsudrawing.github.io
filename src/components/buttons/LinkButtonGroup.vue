<!--
  LinkButtonGroup.vue -- Single link-button group.
  Renders one LinkButtonGroupData item with its buttons.

  Phase 7: replaces build/builders/link-button-groups.ts wrapper div.
-->
<script setup lang="ts">
import { onMounted } from "vue";
import LinkButton from "./LinkButton.vue";
import type { LinkButtonData } from "../../types/app.js";
import { addAllExternalLinkIndicators } from "../../ui/accessibility.js";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** Array of button definitions for this group. */
  buttons: LinkButtonData[];
}>();

// =========================================================================
// Actions
// =========================================================================

// Link button groups are loaded asynchronously (dynamic import) and may mount
// after the global hooks in App.vue.  Re-apply external-link indicators.
onMounted(() => {
  addAllExternalLinkIndicators();
});
</script>

<template>
  <div v-if="buttons.length > 0" class="btn-group link-button-group">
    <LinkButton v-for="(button, idx) in buttons" :key="idx" :button="button" />
  </div>
</template>
