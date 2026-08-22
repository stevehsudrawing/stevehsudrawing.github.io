<!--
  HeroSection.vue — Reusable page hero section.
  Renders a heading, description, and FeatureAwarePicture in a
  responsive flex layout (text left/bottom, image right/top).

  Layout is driven by the shared useBreakpoint() composable:
    - mobile:        image top-right, text below
    - tablet+ / wide: text left, image right

  The image is pinned to a fixed 240×240 box — width/height attributes
  plus an inline style reserve the space before the image loads, so the
  hero contributes zero CLS.

  Used by all 7 full pages (About, Artworks, Softwares, Blogs,
  Chatting, Copyright, and IndexPage sub-sections).
-->
<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../../composables/useBreakpoint";
import type { FeatureAwarePictureProps } from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Constants
// =========================================================================

/** Fixed hero image box size in px — reserved before load to prevent CLS. */
const HERO_IMG_SIZE = 240;

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

// =========================================================================
// State
// =========================================================================

const breakpoint = useBreakpoint();
const isMobile = computed(() => breakpoint.value === "mobile");
</script>

<template>
  <div class="container" :class="{ 'py-4': padding !== false }">
    <div
      class="hero-layout"
      :class="isMobile ? 'hero-layout--mobile' : 'hero-layout--wide'"
    >
      <div class="hero-text">
        <component :is="headingTag ?? 'h1'" class="h1">{{ title }}</component>
        <div v-if="description" class="py-2">
          {{ description }}
        </div>
        <!-- Extra content (LinkButtonGroup, GitHub link, etc.) -->
        <slot />
      </div>
      <div class="hero-img-wrapper">
        <FeatureAwarePicture
          v-bind="image"
          :width="HERO_IMG_SIZE"
          :height="HERO_IMG_SIZE"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- Hero layout (flex, CLS-safe) --- */

.hero-layout {
  display: flex;
  gap: 1.5rem;
}

/* Wide (tablet + desktop): text left, image right */
.hero-layout--wide {
  flex-direction: row;
  align-items: center;
}

.hero-layout--wide .hero-text {
  flex: 1 1 auto;
  min-width: 0;
}

/* Mobile: image top-right, content below */
.hero-layout--mobile {
  flex-direction: column;
}

.hero-layout--mobile .hero-text {
  order: 2;
}

.hero-layout--mobile .hero-img-wrapper {
  order: 1;
  align-self: flex-end;
}

/* Fixed 240×240 image box — reserved dimensions prevent CLS */
.hero-img-wrapper {
  flex: 0 0 auto;
  width: 240px;
  height: 240px;
}
</style>
