<!--
  LinkCardGroup.vue — Single link-card group with heading and card grid.
  Renders one GroupData item from the link-cards JSON config.

  Phase 7: replaces build/builders/link-cards.ts buildGroupNode().
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import {
  extractPlainText,
  toDashCase,
  resolveI18nInHtml,
} from "../../core/utils.js";
import LinkCard from "./LinkCard.vue";
import SectionHeading from "../ui/SectionHeading.vue";
import { toHtml } from "hast-util-to-html";
import type { GroupData } from "../../types/app.js";
import type { HastNode } from "../../types/hast.js";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Group data from JSON config. */
  group: GroupData;
  /** Page path for anchor/copy-link URL generation (e.g. "/about.html"). */
  pagePath: string;
  /** Base URL for copy-link (e.g. "https://stevehsudrawing.github.io"). */
  baseUrl: string;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

/** HAST → HTML for the group title. */
const titleHtml = computed(() =>
  props.group.title
    ? resolveI18nInHtml(
        toHtml(props.group.title as Parameters<typeof toHtml>[0]),
        t,
      )
    : "",
);

/** HAST → HTML for the group description. */
const descHtml = computed(() =>
  props.group.description
    ? resolveI18nInHtml(
        toHtml(props.group.description as Parameters<typeof toHtml>[0]),
        t,
      )
    : "",
);

/** Plain-text title for SectionHeading and id generation. */
const titleText = computed(() =>
  props.group.title ? extractPlainText(props.group.title as HastNode) : "",
);

/** Whether the group has any cards. */
const hasCards = computed(
  () => Array.isArray(props.group.contents) && props.group.contents.length > 0,
);
</script>

<template>
  <div class="link-hub-part">
    <!-- ==== Group header ==== -->
    <SectionHeading
      v-if="props.group.title && titleText"
      :title="titleText"
      :page-path="props.pagePath"
      :base-url="props.baseUrl"
    >
      <span v-html="titleHtml"></span>
    </SectionHeading>

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
