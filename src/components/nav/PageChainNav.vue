<!--
  PageChainNav.vue — Previous / Next page navigation links.
  Derives hrefs from getPageNavLinks() in core/page-chain.ts.

  Renders in a full-width container with Previous (left, secondary color)
  and Next (right, primary color).  Empty spacers prevent layout shift
  when one direction has no link.

  Used by: Artworks, Softwares, Blogs, Chatting, About, Copyright pages.
-->
<script setup lang="ts">
import { computed } from "vue";
import { getPageNavLinks } from "../../core/page-chain";
import TypeAwareLink from "../links/TypeAwareLink.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Page identifier without .html extension (e.g. "softwares", "about"). */
  pageName: string;
}>();

// =========================================================================
// State
// =========================================================================

const nav = computed(() => getPageNavLinks(props.pageName));
</script>

<template>
  <div class="container mt-4 d-flex justify-content-between">
    <!-- Previous (left) or spacer -->
    <TypeAwareLink
      v-if="nav.prev"
      type="internal"
      :href="nav.prev"
      class="link link-hover-change-background link-secondary-shlh fw-semibold"
    >
      <i class="bi bi-arrow-left me-1"></i>
      <span>{{ $t("text-previous-page") }}</span>
    </TypeAwareLink>
    <div v-else></div>

    <!-- Next (right) or spacer -->
    <TypeAwareLink
      v-if="nav.next"
      type="internal"
      :href="nav.next"
      class="link link-hover-change-background link-primary fw-semibold"
    >
      <span>{{ $t("text-next-page") }}</span>
      <i class="bi bi-arrow-right ms-1"></i>
    </TypeAwareLink>
    <div v-else></div>
  </div>
</template>
