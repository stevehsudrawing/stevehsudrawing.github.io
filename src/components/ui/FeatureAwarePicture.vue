<!--
  FeatureAwarePicture.vue -- <picture> wrapper with theme-aware <source>
  elements and a FeatureAwareImg fallback.

  Handles the common pattern of AVIF + WebP sources with theme-aware
  variants, delegating the img element to FeatureAwareImg for colored mask,
  loading opacity, and data-img-loaded marking.

  Phase 7: consolidates repeated <picture> markup across page components.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from "../../composables/useTheme";
import FeatureAwareImg from "./FeatureAwareImg.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** AVIF source — light mode. */
  avifSrcLight?: string;
  /** AVIF source — dark mode (only when feature includes follow-theme). */
  avifSrcDark?: string;
  /** WebP source — light mode. */
  webpSrcLight?: string;
  /** WebP source — dark mode (only when feature includes follow-theme). */
  webpSrcDark?: string;
  /** PNG / fallback source — light mode (required). */
  fallbackSrcLight: string;
  /** PNG / fallback source — dark mode. */
  fallbackSrcDark?: string;
  /** Space-separated feature flags (e.g. "follow-theme", "colored"). */
  feature?: string;
  /** Mask image for "colored" feature. */
  colorMaskSrc?: string;
  /** CSS variable for "colored" tint. */
  colorVar?: string;
  /** HTML alt attribute (pre-resolved from i18n by the parent). */
  alt?: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
  /** fetchpriority attribute (e.g. "high"). */
  fetchpriority?: string;
  /** Additional CSS classes for the img element. */
  imgClass?: string;
}>();

// =========================================================================
// State
// =========================================================================

const { effectiveTheme } = useTheme();

/** Whether this image follows the active theme. */
const isThemeAware = computed(() => props.feature?.includes("follow-theme"));

/** Current AVIF srcset (switches between light/dark for theme-aware images). */
const currentAvifSrc = computed(() =>
  isThemeAware.value && effectiveTheme.value === "dark" && props.avifSrcDark
    ? props.avifSrcDark
    : props.avifSrcLight,
);

/** Current WebP srcset (switches between light/dark for theme-aware images). */
const currentWebpSrc = computed(() =>
  isThemeAware.value && effectiveTheme.value === "dark" && props.webpSrcDark
    ? props.webpSrcDark
    : props.webpSrcLight,
);
</script>

<template>
  <picture>
    <!-- AVIF source -->
    <source
      v-if="avifSrcLight"
      type="image/avif"
      :srcset="currentAvifSrc"
      :fetchpriority="fetchpriority || undefined"
    />

    <!-- WebP source -->
    <source
      v-if="webpSrcLight"
      type="image/webp"
      :srcset="currentWebpSrc"
      :fetchpriority="fetchpriority || undefined"
    />

    <!-- Fallback img via FeatureAwareImg -->
    <FeatureAwareImg
      :light-src="fallbackSrcLight"
      :dark-src="isThemeAware ? fallbackSrcDark : undefined"
      :feature="feature"
      :color-mask-src="colorMaskSrc"
      :color-var="colorVar"
      :alt="alt || ''"
      :width="width"
      :height="height"
      :fetchpriority="fetchpriority"
      :class="imgClass || ''"
    />
  </picture>
</template>
