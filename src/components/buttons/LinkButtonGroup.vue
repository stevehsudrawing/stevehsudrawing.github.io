<!--
  LinkButtonGroup.vue -- Single link-button group.
  Renders one LinkButtonGroupData item with its buttons.

  Phase 7: replaces build/builders/link-button-groups.ts wrapper div.
-->
<script setup lang="ts">
import LinkButton from "./LinkButton.vue";
import type { LinkButtonData } from "../../types/app.js";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** Array of button definitions for this group. */
  buttons: LinkButtonData[];
}>();
</script>

<template>
  <div v-if="buttons.length > 0" class="btn-group link-button-group">
    <LinkButton v-for="(button, idx) in buttons" :key="idx" :button="button" />
  </div>
</template>
