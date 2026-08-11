<!--
  StickerSection.vue — Reusable footer sticker section.
  Renders a 150×150 follow-theme sticker image with an optional
  caption and a default slot for custom content below.

  Sticker image paths are derived from the `stickerId`:
    AVIF: /images/avif/stickers/{light|dark}/{stickerId}.avif
    WebP: /images/webp/stickers/{light|dark}/{stickerId}.webp
  Alt text uses i18n key `text-sticker-of-{stickerId}`.
-->
<script setup lang="ts">
import FeatureAwarePicture from "./FeatureAwarePicture.vue";
import { computed } from "vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /**
   * Sticker filename stem (e.g. "thanks", "thumb").
   * Derives AVIF/WebP paths for both light and dark themes.
   */
  stickerId: string;
  /** Fallback alt text for the sticker image. */
  stickerTitle: string;
  /** Optional plain-text caption below the sticker. */
  caption?: string;
}>();

// =========================================================================
// State
// =========================================================================

const stickerSrcMap = computed(() => ({
  avif: {
    light: { en: `/images/avif/stickers/light/${props.stickerId}.avif` },
    dark: { en: `/images/avif/stickers/dark/${props.stickerId}.avif` },
  },
  webp: {
    light: { en: `/images/webp/stickers/light/${props.stickerId}.webp` },
    dark: { en: `/images/webp/stickers/dark/${props.stickerId}.webp` },
  },
}));

const i18nKey = computed(() => `text-sticker-of-${props.stickerId}`);
</script>

<template>
  <div class="container">
    <div class="py-4 d-flex flex-column align-items-center">
      <FeatureAwarePicture
        :src-map="stickerSrcMap"
        :feature="['follow-theme']"
        :alt="$t(i18nKey, stickerTitle)"
        :width="150"
        :height="150"
        class="no-copy solid-bg"
      />
      <p v-if="caption" class="opacity-75 mt-3">
        <span>{{ caption }}</span>
      </p>
      <slot />
    </div>
  </div>
</template>
