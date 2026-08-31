<!--
  FeatureAwarePicture.vue — universal non-colored image component.

  Merges the old FeatureAwareImg (bare <img>) and FeatureAwarePicture
  (<picture> wrapper) into a single component.  Rendering strategy:

    src provided           → bare <img> with static src
    srcMap without avif    → bare <img> with theme/language-resolved src
    srcMap with avif       → <picture> with AVIF + WebP <source> elements

  Colored (CSS mask) rendering is handled by the separate ColoredImg
  component.  This component does NOT output data-img-feature.
-->
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import { resolveLanguageAwareString } from "../../core/utils";
import type {
  FeatureAwarePictureProps,
  Lang,
  ThemeAwareImgSrcMap,
} from "../../types/app";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<FeatureAwarePictureProps>();

// =========================================================================
// State
// =========================================================================

const { effectiveTheme } = useTheme();
const { locale } = useI18n();

const loaded = ref(false);
const imgRef = ref<HTMLImageElement>();

// -------------------------------------------------------------------------
// Feature checks
// -------------------------------------------------------------------------

const followTheme = computed(() =>
  (props.feature ?? []).includes("follow-theme"),
);
const followLanguage = computed(() =>
  (props.feature ?? []).includes("follow-language"),
);

// -------------------------------------------------------------------------
// Resolved theme / language keys
// -------------------------------------------------------------------------

const resolvedTheme = computed(() =>
  followTheme.value ? effectiveTheme.value : "light",
);
const resolvedLang = computed(() =>
  followLanguage.value ? locale.value : "en",
);

// -------------------------------------------------------------------------
// Source resolution
// -------------------------------------------------------------------------

/**
 * Resolve a single theme-keyed src map to a URL.
 *
 * @param themeMap - The theme-aware source map to resolve.
 * @param theme - Target theme key ("light" or "dark").
 * @param lang - Target language key ("en", "zh-Hans", "zh-Hant").
 * @returns The resolved URL string, or undefined.
 */
function resolveThemeSrc(
  themeMap: ThemeAwareImgSrcMap | undefined,
  theme: string,
  lang: string,
): string | undefined {
  if (!themeMap) return undefined;

  // Theme: try target → fall back to light
  const langMap =
    themeMap[theme as keyof ThemeAwareImgSrcMap] ?? themeMap.light;

  // Language: exact match → fall back to en (shared resolver)
  return resolveLanguageAwareString(langMap, lang as Lang) || undefined;
}

/** Resolved <img> src — always from webp (or static `src`). */
const resolvedImgSrc = computed(() => {
  if (props.src) return props.src;
  if (!props.srcMap) return "";
  return (
    resolveThemeSrc(
      props.srcMap.webp,
      resolvedTheme.value,
      resolvedLang.value,
    ) ?? ""
  );
});

/** Resolved AVIF src — only when srcMap.avif is present. */
const resolvedAvifSrc = computed(() => {
  if (!props.srcMap?.avif) return undefined;
  return resolveThemeSrc(
    props.srcMap.avif,
    resolvedTheme.value,
    resolvedLang.value,
  );
});

/** Whether to render a full <picture> element. */
const renderPicture = computed(() => !!props.srcMap?.avif);

/**
 * Combined class: the passed-in class plus the conditional
 * `img-aspect-ratio` marker (drives the shimmer placeholder only
 * when an explicit aspect ratio is provided).
 */
const imgClass = computed(() => [
  props.class,
  { "img-aspect-ratio": props.aspectRatio !== undefined },
]);

// =========================================================================
// Actions
// =========================================================================

function onLoad(): void {
  loaded.value = true;
}

function onError(): void {
  loaded.value = true;
}

onMounted(() => {
  if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    loaded.value = true;
  }
});
</script>

<template>
  <!-- With AVIF: full <picture> -->
  <picture v-if="renderPicture">
    <source
      type="image/avif"
      :srcset="resolvedAvifSrc"
      :fetchpriority="fetchpriority"
    />
    <img
      ref="imgRef"
      :src="resolvedImgSrc"
      :alt="alt"
      :width="width"
      :height="height"
      :style="{
        width: width,
        height: height,
        aspectRatio:
          aspectRatio !== undefined ? String(aspectRatio) : undefined,
      }"
      :class="imgClass"
      :loading="loading"
      :fetchpriority="fetchpriority"
      :data-img-loaded="loaded ? '' : undefined"
      @load="onLoad"
      @error="onError"
    />
  </picture>

  <!-- No AVIF: bare <img> -->
  <img
    v-else
    ref="imgRef"
    :src="resolvedImgSrc"
    :alt="alt"
    :width="width"
    :height="height"
    :style="{
      width: width,
      height: height,
      aspectRatio: aspectRatio !== undefined ? String(aspectRatio) : undefined,
    }"
    :class="imgClass"
    :loading="loading"
    :fetchpriority="fetchpriority"
    :data-img-loaded="loaded ? '' : undefined"
    @load="onLoad"
    @error="onError"
  />
</template>

<style scoped>
/* ==== Image loading opacity (global, applies site-wide) ==== */

img {
  opacity: 0.5;
  transition: opacity 0.2s ease;
  cursor: wait;
}

img[data-img-loaded] {
  opacity: 1;
  cursor: inherit;
}

/* --- Image placeholder (aspect-ratio reservation + shimmer) ---
   Only on imgs that carry an explicit aspectRatio (e.g. gallery
   posters): while the lazy image is still downloading the slot shows
   a themed shimmer; on load the existing fade-in takes over and the
   shimmer background is removed.  Browsers without CSS `aspect-ratio`
   simply skip the slot (progressive enhancement). */

.img-aspect-ratio:not([data-img-loaded]) {
  opacity: 0;
  background-color: var(--bs-secondary-bg);
  background-image: linear-gradient(
    100deg,
    transparent 40%,
    rgba(var(--bs-body-color-rgb), 0.08) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: picture-shimmer 1.4s linear infinite;
}

.img-aspect-ratio[data-img-loaded] {
  background: none;
}

@keyframes picture-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .img-aspect-ratio:not([data-img-loaded]) {
    animation: none;
  }
}
</style>
