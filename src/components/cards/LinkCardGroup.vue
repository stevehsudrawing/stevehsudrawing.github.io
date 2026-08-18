<!--
  LinkCardGroup.vue — Single link-card group with heading and card grid.
  Renders one LinkCardGroupData item from the link-cards JSON config.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import { resolveI18nInHtml } from "../../core/utils";
import LinkCard from "./LinkCard.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import { toHtml } from "hast-util-to-html";
import type { LinkCardGroupData } from "../../types/app";

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

/** HAST -> HTML for the group description. */
const descHtml = computed(() =>
  props.group.description
    ? resolveI18nInHtml(
        toHtml(props.group.description as Parameters<typeof toHtml>[0]),
        t,
      )
    : "",
);

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
    <p v-if="descHtml" class="card-text" v-html="descHtml"></p>

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
