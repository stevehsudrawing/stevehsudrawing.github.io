<!--
  HeroSection.vue — Reusable page hero section.
  Renders a heading, description, and FeatureAwarePicture in a
  responsive flex layout (text left/bottom, image right/top).

  Layout is driven by the shared useBreakpoint() composable:
    - mobile:        image top-right, text below
    - tablet+ / wide: text left, image right

  The image box is always reserved before load (zero CLS): 240×240 on
  mobile/tablet; on desktop / wide-desktop the cover becomes 25% of
  the container content width (square padding-top box, absolutely
  positioned img with object-fit: contain).

  Used by all 7 full pages (About, Artworks, Softwares, Blogs,
  Chatting, Copyright, and IndexPage sub-sections).
-->
<script setup lang="ts">
import { computed } from "vue";
import { useBreakpoint } from "../../composables/core/useBreakpoint";
import type { FeatureAwarePictureProps } from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

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

/** Desktop-wide breakpoints (desktop / wide-desktop) — fluid 25% cover. */
const isDesktop = computed(
  () => breakpoint.value === "desktop" || breakpoint.value === "wide-desktop",
);
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
      <div
        class="hero-img-wrapper"
        :class="{ 'hero-img-wrapper--fluid': isDesktop }"
      >
        <FeatureAwarePicture v-bind="image" />
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

/* Fixed 240×240 square box (mobile / tablet) — reserved dimensions
   prevent CLS.  max-width: 100% caps the box to the layout width for
   extreme viewports (< 240 px). */
.hero-img-wrapper {
  flex: 0 0 auto;
  width: 240px;
  height: 240px;
  max-width: 100%;
  position: relative;
}

/* Extreme viewports (< 240 px): the box spans the layout width and
   stays square via padding-top — here the box IS the layout width, so
   the parent-relative percentage matches (baseline-safe). */
@media (max-width: 240px) {
  .hero-img-wrapper {
    width: 100%;
    height: auto;
    padding-top: 100%;
  }
}

/* Desktop / wide-desktop: the cover takes 25% of the container content
   width — square via padding-top (baseline-safe, no CSS aspect-ratio). */
.hero-img-wrapper--fluid {
  flex: 0 0 25%;
  width: 25%;
  height: auto;
  padding-top: 25%;
}

/* FeatureAwarePicture's overlay-control wrapper (emitted only when the
   hero image opts into `showAltButton` / `previewable`) must fill the
   reserved box as well — it becomes the positioning context for the
   img below (and hosts the corner controls). */
.hero-img-wrapper :deep(.feature-aware-picture) {
  position: absolute;
  inset: 0;
}

/* The img always fills the wrapper box (contain — no distortion), on
   every breakpoint. */
.hero-img-wrapper :deep(picture),
.hero-img-wrapper :deep(img) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
