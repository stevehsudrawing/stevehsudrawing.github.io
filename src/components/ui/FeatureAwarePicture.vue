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
import { ref, computed, onMounted } from "vue";
import { useTheme } from "../../composables/useTheme";
import { useI18n } from "../../composables/useI18n";
import type {
  PictureSrcMap,
  ThemeAwareImgSrcMap,
  LanguageAwareImgSrcMap,
  ImgFeature,
} from "../../types/app";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Static src URL.  Mutually exclusive with `srcMap`. */
  src?: string;
  /** Structured multi-format source map.  Mutually exclusive with `src`. */
  srcMap?: PictureSrcMap;
  /** Feature flags driving theme/language resolution on `srcMap`. */
  feature?: ImgFeature[];
  /** Alt text (pre-resolved from i18n). */
  alt?: string;
  /** Image width. */
  width?: number;
  /** Image height. */
  height?: number;
  /** Additional CSS classes for the img element. */
  class?: string;
  /** fetchpriority attribute (e.g. "high" for hero images). */
  fetchpriority?: "high" | "low" | "auto" | undefined;
  /** Native lazy loading. */
  loading?: "lazy" | "eager";
}>();

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
  let langMap: LanguageAwareImgSrcMap | undefined =
    themeMap[theme as keyof ThemeAwareImgSrcMap];
  if (!langMap) {
    langMap = themeMap.light;
  }

  // Language: exact match → fall straight back to en
  return langMap[lang as keyof LanguageAwareImgSrcMap] ?? langMap.en;
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
      :style="{ width: width, height: height }"
      :class="class"
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
    :style="{ width: width, height: height }"
    :class="class"
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
</style>
