<!--
  LinkCardGroup.vue — Single link-card group with heading and card grid.
  Renders one LinkCardGroupData item from the link-cards JSON config.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import type { LinkCardGroupData } from "../../types/app";
import type { HastNode } from "../../types/hast";
import HastFragment from "../render-functions/HastFragment.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import LinkCard from "./LinkCard.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Group data from JSON config. */
  group: LinkCardGroupData;
  /** Page path for anchor/copy-link URL generation (e.g. "/about.html"). */
  pagePath: string;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

/** HAST children for the group description. */
const descNodes = computed<HastNode[]>(() => {
  if (!props.group.description) return [];
  const desc = props.group.description;
  return desc.type === "root" && Array.isArray(desc.children)
    ? (desc.children as HastNode[])
    : [desc as HastNode];
});

/** Whether the group has any cards. */
const hasCards = computed(() => props.group.contents.length > 0);
</script>

<template>
  <div>
    <!-- ==== Group header ==== -->
    <SectionHeading
      :title="t('text-' + props.group.id)"
      :heading-id="props.group.id"
      :page-path="props.pagePath"
    />

    <!-- Group description -->
    <p v-if="descNodes.length" class="card-text">
      <HastFragment :nodes="descNodes" />
    </p>

    <!-- Cards grid -->
    <div v-if="hasCards" class="row g-0">
      <LinkCard
        v-for="(cardData, idx) in props.group.contents"
        :key="idx"
        :card="cardData"
      />
    </div>
  </div>
</template>

<style scoped>
/*
 * Migrated from base.css — Title Link Anchors section.
 * Heading/anchor styles moved to SectionHeading.vue.
 */
</style>
