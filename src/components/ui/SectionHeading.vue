<!--
  SectionHeading.vue — Section heading with anchor and copy-link buttons.
  Renders a heading (default <h2>) with a dash-case id (auto-generated from
  the title), an AnchorButton for permalink sharing, and a CopyButton for
  clipboard copy.

  Used by LinkCardGroup.vue / PictureGroup.vue (HAST titles via slot),
  page components (static i18n titles via prop), and MarkdownArticle.vue
  (markdown headings, rendered through a `section-heading` HAST marker).
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

const props = withDefaults(
  defineProps<{
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
    /**
     * Semantic heading level, an integer in [2, 6] (default 2).
     * Renders `<h{level}>` with the Bootstrap size class
     * `.h{min(level + 2, 6)}` — i.e. level 2 -> .h4, 3 -> .h5, 4+ -> .h6.
     */
    level?: number;
  }>(),
  { level: 2 },
);

// =========================================================================
// State
// =========================================================================

const titleId = computed(() => props.headingId || toDashCase(props.title));

/** Heading level clamped to the [2, 6] range. */
const headingLevel = computed(() => Math.min(Math.max(props.level, 2), 6));

/** Bootstrap heading size class: .h4 / .h5 / .h6 (never exceeds 6). */
const headingClass = computed(() => `h${Math.min(headingLevel.value + 2, 6)}`);

const copyUrl = computed(() =>
  props.pagePath ? `${BASE_URL}${props.pagePath}#${titleId.value}` : "",
);
</script>

<template>
  <div class="section-heading-wrapper">
    <component
      :is="`h${headingLevel}`"
      :id="titleId || undefined"
      class="section-heading"
      :class="headingClass"
    >
      <slot>{{ title }}</slot>
    </component>
    <div class="section-heading-buttons-wrapper">
      <AnchorButton
        v-if="titleId"
        class="my-auto me-1"
        :target-id="titleId"
        :heading-title="title"
      />
      <CopyButton
        v-if="titleId && copyUrl"
        class="my-auto link title-link-anchor"
        :copy-text="copyUrl"
      >
        <i class="bi bi-link-45deg"></i>
      </CopyButton>
    </div>
  </div>
</template>

<style scoped>
.section-heading-wrapper {
  display: flex;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.section-heading-buttons-wrapper {
  display: flex;
  font-size: 1rem;
  margin-left: 0.5rem;
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

  .section-heading-wrapper:hover .title-link-anchor,
  .section-heading-wrapper:focus-within .title-link-anchor {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}
</style>
