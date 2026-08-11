<!--
  HeroSection.vue — Reusable page hero section.
  Renders a heading, description, and FeatureAwarePicture in a
  responsive two-column flex layout (text left/bottom, image right/top).

  Used by all 7 full pages (About, Artworks, Softwares, Blogs,
  Chatting, Copyright, and IndexPage sub-sections).
-->
<script setup lang="ts">
import FeatureAwarePicture from "./FeatureAwarePicture.vue";
import type { FeatureAwarePictureProps } from "../../types/app";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** Heading text (pre-resolved from i18n by the parent). */
  title: string;
  /**
   * Semantic heading tag.  Defaults to `h1`.
   * Use `h2` when the page already has an `<h1>` for SEO.
   * Always renders with the `.h1` class for visual consistency.
   */
  headingTag?: "h1" | "h2";
  /** Description paragraph (optional; omitted when not provided). */
  description?: string;
  /** Image properties — passed directly to FeatureAwarePicture. */
  image: FeatureAwarePictureProps;
  /**
   * Whether the outer container has `py-4` vertical padding.
   * Defaults to `true`.  Set to `false` for compact sections
   * (e.g. IndexPage sub-sections).
   */
  padding?: boolean;
}>();
</script>

<template>
  <div class="container" :class="{ 'py-4': padding !== false }">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <component :is="headingTag ?? 'h1'" class="h1">{{ title }}</component>
        <div v-if="description" class="py-2">
          {{ description }}
        </div>
        <!-- Extra content (LinkButtonGroup, GitHub link, etc.) -->
        <slot />
      </div>
      <div class="hero-img-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture v-bind="image" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Sub Cover Wrapper --- */

.hero-img-wrapper {
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  align-content: space-around;
  flex-grow: 1;
}

.hero-img-wrapper picture {
  width: 240px;
}

/* Mobile (< 768px) */
@media (max-width: 767.98px) {
  .hero-img-wrapper picture {
    width: 50%;
  }
}
</style>
