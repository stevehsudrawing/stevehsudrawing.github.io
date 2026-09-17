<!--
  FeatureAwarePicture.vue — universal non-colored image component.

  Merges the old FeatureAwareImg (bare <img>) and FeatureAwarePicture
  (<picture> wrapper) into a single component.  Rendering strategy:

    src provided           → bare <img> with static src
    srcMap without avif    → bare <img> with theme/language-resolved src
    srcMap with avif       → <picture> with AVIF + WebP <source> elements

  Colored (CSS mask) rendering is handled by the separate ColoredImg
  component.  This component does NOT output data-img-feature.

  Overlay controls (opt-in): with `showAltButton` and/or `previewable`
  the component wraps the image in a positioned box and adds corner
  controls on the bottom edge — an ALT button opening a BPopover with
  the picture title (falling back to the generic description label),
  the image description and the optional `message` as its secondary
  line, and a preview button opening the single-image viewer.  Without
  those flags the rendered DOM is unchanged (a bare <picture> / <img>
  root) — every legacy consumer relies on that.  `relatedLink` is
  carried for the lightboxes only; `message` renders only in the ALT
  popover.
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "../../composables/useI18n";
import { usePictureViewer } from "../../composables/usePictureViewer";
import { useTheme } from "../../composables/useTheme";
import { resolveLanguageAwareString } from "../../core/utils";
import { isImageEdgeDark } from "../../platform/image-luminance";
import type {
  FeatureAwarePictureProps,
  Lang,
  ThemeAwareImgSrcMap,
} from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<FeatureAwarePictureProps>();

// =========================================================================
// State
// =========================================================================

const { effectiveTheme } = useTheme();
const { locale, t } = useI18n();
const { openPictureViewer } = usePictureViewer();

const loaded = ref(false);
const imgRef = ref<HTMLImageElement>();

// -------------------------------------------------------------------------
// Overlay controls (ALT / preview) — opt-in via props
// -------------------------------------------------------------------------

/** ALT corner button — only when requested AND an alt text exists. */
const hasAltButton = computed(() => !!props.showAltButton && !!props.alt);

/**
 * ALT popover header — the picture title, or the generic description
 * label when none was passed.  An empty title falls back too: the i18n
 * resolver returns "" for a missing key, and `||` (never `??`) is what
 * turns that into the default.
 */
const popoverTitle = computed(() => props.title || t("text-image-description"));

/** Whether the positioned wrapper + overlay controls are rendered. */
const hasOverlayControls = computed(
  () => hasAltButton.value || !!props.previewable,
);

/** Bottom-edge luminance of the current source (`null` while unknown). */
const bottomDark = ref<boolean | null>(null);

/**
 * Palette class for the overlay controls — the shared on-image palette
 * (`src/stylesheets/on-image-controls.css`), also used by the Carousel
 * and the picture viewers.
 */
const overlayPaletteClass = computed(() =>
  bottomDark.value === true
    ? "controls-on-image-dark"
    : bottomDark.value === false
      ? "controls-on-image-light"
      : "",
);

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
 * Whether the layout space is reserved before the image loads —
 * either via an explicit `aspectRatio` (ratio box) or via both
 * `width` and `height` (fixed pixel box, e.g. HeroSection).
 */
const hasReservedSpace = computed(
  () =>
    props.aspectRatio !== undefined ||
    (props.width !== undefined && props.height !== undefined),
);

/**
 * Combined class: the passed-in class plus the conditional
 * `img-loading-placeholder` marker (drives the shimmer placeholder
 * whenever the layout space is reserved).  Tokens are deduplicated —
 * several sources may legitimately repeat one (registry `noCopy`, a
 * template class, a consumer override).
 */
const imgClass = computed(() => {
  const tokens = (props.class ?? "").split(/\s+/).filter(Boolean);
  if (hasReservedSpace.value) tokens.push("img-loading-placeholder");
  return [...new Set(tokens)];
});

// =========================================================================
// Actions
// =========================================================================

function onLoad(): void {
  loaded.value = true;
}

function onError(): void {
  loaded.value = true;
}

/**
 * Sample the bottom 5 % band of the current source — the corner
 * controls sit on the bottom edge.  Skipped entirely while no overlay
 * control is rendered (the platform service also caches per src).
 */
function sampleBottomLuminance(): void {
  if (!hasOverlayControls.value) return;
  const img = imgRef.value;
  const src = img?.currentSrc || img?.src;
  if (!src) return;
  void isImageEdgeDark(src, { edge: "bottom", ratio: 0.05 }).then((dark) => {
    bottomDark.value = dark;
  });
}

/** Preview button click — open the single-image viewer with these props. */
function onPreviewClick(): void {
  openPictureViewer({ ...props });
}

onMounted(() => {
  if (imgRef.value?.complete && imgRef.value.naturalWidth > 0) {
    loaded.value = true;
  }
  sampleBottomLuminance();
});

// Re-sample when the resolved source changes (theme / language switch).
watch([resolvedImgSrc, resolvedAvifSrc], () => {
  bottomDark.value = null;
  sampleBottomLuminance();
});
</script>

<template>
  <!--
    With overlay controls: positioned wrapper + bottom-edge controls.
    The image markup below is intentionally repeated in the v-else
    branch so legacy consumers keep a bare <picture> / <img> root.
  -->
  <div v-if="hasOverlayControls" class="feature-aware-picture">
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

    <!-- ==== Overlay controls: ALT (left) + preview (right) ==== -->
    <div class="picture-overlay-controls" :class="overlayPaletteClass">
      <BPopover
        v-if="hasAltButton"
        :title="popoverTitle"
        placement="top"
        hover
        focus
        lazy
        teleport-to="body"
      >
        <template #target>
          <button
            type="button"
            class="picture-overlay-btn picture-overlay-btn-alt"
            :aria-label="t('text-image-description')"
          >
            ALT
          </button>
        </template>
        {{ alt }}
        <div v-if="message" class="picture-alt-popover-message">
          <i>{{ message }}</i>
        </div>
      </BPopover>
      <button
        v-if="previewable"
        type="button"
        class="picture-overlay-btn picture-overlay-btn-preview"
        :aria-label="t('text-image-preview')"
        @click="onPreviewClick"
      >
        <MaterialSymbol name="zoom_in" />
      </button>
    </div>
  </div>

  <!-- Legacy: bare root (no wrapper) — see the component header -->
  <template v-else>
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
  </template>
</template>

<style scoped>
/* ==== Image loading opacity (global, applies site-wide) ==== */

img {
  opacity: var(--shlh-loading-opacity);
  transition: opacity var(--shlh-duration-base) ease;
  cursor: wait;
}

img[data-img-loaded] {
  opacity: 1;
  cursor: inherit;
}

/* ==== Overlay controls (ALT + preview corners) ==== */

/* Positioning context for the corner controls — emitted only when an
   overlay control is requested (see the component header). */
.feature-aware-picture {
  position: relative;
  display: inline-block;
  max-width: 100%;
}

/* Full-area layer: keeps every control anchored to the image corners
   whatever element the popover trigger renders in between. */
.picture-overlay-controls {
  position: absolute;
  inset: 0;
  z-index: var(--shlh-z-on-image);
  pointer-events: none;
}

/* Corner buttons: collapsed to a point, growing diagonally out of their
   own corner in 0.1 s (same visual language as the Carousel controls).
   The `transform` transition replaces width/height because the ALT
   button's width follows its label and cannot animate from 0. */
.picture-overlay-btn {
  position: absolute;
  bottom: 1px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.5rem;
  padding: 0 0.375rem;
  border: 0;
  border-radius: var(--bs-border-radius);
  /* OPAQUE palette (no translucency, no backdrop blur): the label keeps
     a constant high contrast on any image, and the hover `invert(1)`
     below becomes a clean black<->white swap.  `#000` / `#fff` is the
     pre-sampling fallback (luminance still unknown) — deliberately NOT a
     theme colour, which would vanish over a bright cover in the light
     theme. */
  background: var(--shlh-on-image-control-bg, #000);
  color: var(--shlh-on-image-control-color, #fff);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.02em;
  transform: scale(0);
  transition: transform var(--shlh-duration-fast) ease;
  pointer-events: none;
  cursor: pointer;
}

.picture-overlay-btn-alt {
  left: 1px;
  transform-origin: left bottom;
}

.picture-overlay-btn-preview {
  right: 1px;
  width: 1.5rem;
  padding: 0;
  transform-origin: right bottom;
}

/* Reveal: pointer modality via wrapper hover / focus; the touch and
   keyboard modalities keep the controls visible (input-modality
   classes on <html>). */
.feature-aware-picture:hover .picture-overlay-btn,
.feature-aware-picture:focus-within .picture-overlay-btn,
html.user-input-touch .picture-overlay-btn,
html.user-input-keyboard .picture-overlay-btn {
  transform: scale(1);
  pointer-events: auto;
}

/* Interaction feedback: the pill is opaque and the palette contract is
   pure #000/#fff, so this flip lands on the opposite pure colour. */
.picture-overlay-btn:hover,
.picture-overlay-btn:active,
.picture-overlay-btn:focus-visible {
  filter: invert(1);
}

/* --- ALT popover content ---
   Secondary line under the alt text — the picture `message`, when
   present.  Lives inside the teleported popover body; the slot content
   keeps this component's scope attribute, so the scoped rule matches. */
.picture-alt-popover-message {
  margin-top: 0.25rem;
  color: var(--bs-secondary-color);
}

/* --- Image placeholder (reserved-space reservation + shimmer) ---
   Applies to imgs with a reserved layout space — either an explicit
   `aspectRatio` (ratio box, e.g. gallery posters) OR both `width`
   and `height` (fixed pixel box, e.g. HeroSection).  While the lazy
   image is still downloading the slot shows a themed shimmer; on
   load the shimmer background is removed and the base opacity
   transition fades the image in (the former reveal animation was
   removed in v3.16.2 — Firefox could freeze it at an intermediate
   opacity).  Browsers without CSS
   `aspect-ratio` skip the ratio box (progressive enhancement).
   NOTE: the shimmer is the element's own background — keep
   `opacity: 1` here, an element-level opacity would hide the
   placeholder too. */

.img-loading-placeholder:not([data-img-loaded]) {
  opacity: 1;
  background-color: var(--bs-secondary-bg);
  background-image: linear-gradient(
    100deg,
    transparent 40%,
    rgba(var(--bs-body-color-rgb), var(--shlh-shimmer-alpha)) 50%,
    transparent 60%
  );
  background-size: 200% 100%;
  animation: picture-shimmer 1.4s linear infinite;
}

.img-loading-placeholder[data-img-loaded] {
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
  .img-loading-placeholder:not([data-img-loaded]) {
    animation: none;
  }
}
</style>
