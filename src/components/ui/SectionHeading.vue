<!--
  SectionHeading.vue — Section heading with anchor and copy-link buttons.
  Renders an <h2> with a dash-case id (auto-generated from the title),
  an AnchorButton for permalink sharing, and a CopyButton for clipboard copy.

  Used by LinkCardGroup.vue (HAST titles via slot) and page components
  (static i18n titles via prop).
-->
<script setup lang="ts">
import { computed } from "vue";
import { toDashCase } from "../../core/utils";
import { BASE_URL } from "../../configs/site-meta";
import AnchorButton from "../buttons/AnchorButton.vue";
import CopyButton from "../buttons/CopyButton.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Plain-text heading (used for id generation and aria-label). */
  title: string;
  /**
   * Stable, language-independent anchor ID.
   * When provided, used directly as the heading's HTML id.
   * When omitted, derived from `title` via toDashCase().
   */
  headingId?: string;
  /** Page path for copy-link URL (e.g. "/about.html"). */
  pagePath?: string;
}>();

// =========================================================================
// State
// =========================================================================

const titleId = computed(() => props.headingId || toDashCase(props.title));

const copyUrl = computed(() =>
  props.pagePath ? `${BASE_URL}${props.pagePath}#${titleId.value}` : "",
);
</script>

<template>
  <div class="title-link-group-wrapper">
    <h2 v-if="titleId" :id="titleId" class="title-link-group h4">
      <slot>{{ title }}</slot>
    </h2>
    <h2 v-else class="title-link-group h4">
      <slot>{{ title }}</slot>
    </h2>
    <div>
      <AnchorButton
        v-if="titleId"
        class="me-2"
        :target-id="titleId"
        :heading-title="title"
      />
      <CopyButton
        v-if="titleId && copyUrl"
        class="link title-link-anchor"
        :copy-text="copyUrl"
      >
        <i class="bi bi-link-45deg"></i>
      </CopyButton>
    </div>
  </div>
</template>

<style scoped>
/* ---- Group header ---- */
.title-link-group {
  margin-top: 10px;
  margin-bottom: 15px;
}

.title-link-group-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

/* ---- Title link anchors ---- */
.title-link-anchor {
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease;
}

/* Mobile (< 768px) */
@media (max-width: 767.98px) {
  .title-link-anchor {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* Tablet & Desktop (>= 768px) */
@media (min-width: 768px) {
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
