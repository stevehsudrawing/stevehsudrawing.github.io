<!--
  StickerSection.vue — Reusable footer sticker section.
  Renders a 150×150 follow-theme sticker image with an optional
  caption and a default slot for custom content below.

  Sticker image paths are derived from the `stickerId` via
  `createStickerSrcMap()` (shared with StickerModal):
    AVIF: /images/avif/stickers/{light|dark}/{stickerId}.avif
    WebP: /images/webp/stickers/{light|dark}/{stickerId}.webp
  Alt text uses i18n key `text-sticker-of-{stickerId}-alt`.
-->
<script setup lang="ts">
import { computed } from "vue";
import { createStickerSrcMap } from "../../core/utils";
import type { StickerProps } from "../../types/app";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<StickerProps>();

// =========================================================================
// State
// =========================================================================

const stickerSrcMap = computed(() => createStickerSrcMap(props.stickerId));

const i18nKey = computed(() => `text-sticker-of-${props.stickerId}-alt`);
</script>

<template>
  <div class="container">
    <div class="py-4 d-flex flex-column align-items-center">
      <FeatureAwarePicture
        :src-map="stickerSrcMap"
        :feature="['follow-theme']"
        :alt="$t(i18nKey)"
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
