<!--
  LinkCardGroups.vue — Page-level link-card section.
  Iterates over GroupData[] from the link-cards JSON config and renders
  each group with <hr> separators between them.
-->
<script setup lang="ts">
import LinkCardGroup from "./LinkCardGroup.vue";
import type { GroupData } from "../../types/app";

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
</script>

<template>
  <template v-for="(group, idx) in groups" :key="idx">
    <hr v-if="idx > 0" />
    <LinkCardGroup :group="group" :page-path="pagePath" :base-url="baseUrl" />
  </template>
</template>
