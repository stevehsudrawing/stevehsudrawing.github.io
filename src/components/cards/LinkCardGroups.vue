<!--
  LinkCardGroups.vue — Page-level link-card section.
  Iterates over GroupData[] from the link-cards JSON config and renders
  each group with <hr> separators between them.

  Phase 7: replaces build/builders/link-cards.ts buildLinkCardsHTML().
-->
<script setup lang="ts">
import { onMounted } from "vue";
import LinkCardGroup from "./LinkCardGroup.vue";
import type { GroupData } from "../../types/app.js";
import { addAllExternalLinkIndicators } from "../../ui/accessibility.js";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** All link-card groups for this page. */
  groups: GroupData[];
  /** Page path for anchor/copy-link URL generation (e.g. "/about.html"). */
  pagePath: string;
  /** Base URL for copy-link (e.g. "https://stevehsudrawing.github.io"). */
  baseUrl: string;
}>();

// =========================================================================
// Actions
// =========================================================================

// Link cards are loaded asynchronously (dynamic import) and may mount after
// the global onMounted + router.afterEach hooks in App.vue.  Re-apply
// external-link indicators once the cards are guaranteed to be in the DOM.
onMounted(() => {
  addAllExternalLinkIndicators();
});
</script>

<template>
  <template v-for="(group, idx) in groups" :key="idx">
    <hr v-if="idx > 0" />
    <LinkCardGroup :group="group" :page-path="pagePath" :base-url="baseUrl" />
  </template>
</template>
