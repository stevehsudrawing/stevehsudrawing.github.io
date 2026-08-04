<!--
  LinkCardGroup.vue — Single link-card group with heading and card grid.
  Renders one GroupData item from the link-cards JSON config.

  Phase 7: replaces build/builders/link-cards.ts buildGroupNode().
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { extractPlainText, toDashCase } from "../../core/utils.js";
import LinkCard from "./LinkCard.vue";
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
    ? toHtml(props.group.title as Parameters<typeof toHtml>[0])
    : "",
);

/** HAST → HTML for the group description. */
const descHtml = computed(() =>
  props.group.description
    ? toHtml(props.group.description as Parameters<typeof toHtml>[0])
    : "",
);

/** Plain-text title for id generation and anchor label. */
const titleText = computed(() =>
  props.group.title ? extractPlainText(props.group.title as HastNode) : "",
);

/** Dash-case id for heading anchor. */
const titleId = computed(() => toDashCase(titleText.value));

/** Copy-link URL (full URL with anchor). */
const copyUrl = computed(
  () => `${props.baseUrl}${props.pagePath}#${titleId.value}`,
);

/** Whether the group has any cards. */
const hasCards = computed(
  () => Array.isArray(props.group.contents) && props.group.contents.length > 0,
);
</script>

<template>
  <div class="link-hub-part">
    <!-- ==== Group header ==== -->
    <div v-if="props.group.title" class="title-link-group-wrapper">
      <h2 class="title-link-group h4" :id="titleId">
        <span v-html="titleHtml"></span>
      </h2>
      <a
        v-if="titleId"
        class="title-link-anchor"
        :href="`#${titleId}`"
        :aria-label="`Link to ${titleText}`"
        data-bs-toggle="tooltip"
        data-bs-title="Anchor"
        data-i18n-tooltip="text-anchor"
      >
        <i class="bi bi-paragraph"></i>
      </a>
      <a
        v-if="titleId"
        class="link title-link-anchor copy-link"
        href="#"
        :aria-label="`Copy the link to ${titleText}`"
        :data-copy-text="copyUrl"
      >
        <i class="bi bi-link-45deg"></i>
      </a>
    </div>

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
 * Migrated from base.css -- Title Link Anchors section.
 * These were build-time injected link-card group styles, now owned by LinkCardGroup.vue.
 */

/* ---- Group header ---- */
.title-link-group {
  margin-top: 10px;
  margin-bottom: 15px;
}

.title-link-group-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* ---- Title link anchors ---- */
.title-link-anchor {
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

/* Mobile (< 992px) */
@media (max-width: 991.98px) {
  .title-link-anchor {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* Desktop (>= 992px) */
@media (min-width: 992px) {
  .title-link-anchor {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }

  .title-link-group-wrapper:hover .title-link-anchor,
  .title-link-group-wrapper:focus-within .title-link-anchor {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}
</style>
