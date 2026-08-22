<!--
  LinkCardGroups.vue — Page-level link-card section.
  Iterates over LinkCardGroupData[] from the link-cards JSON config and
  renders each group with <hr> separators between them.
-->
<script setup lang="ts">
import type { LinkCardGroupData } from "../../types/app";
import LinkCardGroup from "./LinkCardGroup.vue";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** All link-card groups for this page. */
  groups: LinkCardGroupData[];
  /** Page path for anchor/copy-link URL generation (e.g. "/about.html"). */
  pagePath: string;
}>();
</script>

<template>
  <template v-for="(group, idx) in groups" :key="idx">
    <hr v-if="idx > 0" />
    <LinkCardGroup :group="group" :page-path="pagePath" />
  </template>
</template>
