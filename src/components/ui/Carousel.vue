<!--
  Carousel.vue — Hero illustration carousel (IndexPage).

  Swiper v14 replacement for the old BCarousel + BCarouselSlide:
    - Effect creative transition, `rewind` mode (loop breaks creative
      progress — see docs/todos/v3.12.0.md §13)
    - Autoplay state derived from the Swiper instance (no drift)
    - Config-driven slides from `src/configs/picture-list/index.json`
      (group id `carousel-illustration`)
    - One controls group: play/pause + per-slide countdown bars +
      related-link button (expanded on hover / always for keyboard+touch)
    - Adaptive control color from the active image's edge luminance

  Unsupported browsers (Swiper v14 baseline, see isSwiperSupported) and
  no-JS environments get a static first-slide fallback.
-->
<script setup lang="ts">
import "swiper/css";
import "swiper/css/a11y";
import "swiper/css/autoplay";
import "swiper/css/effect-creative";
import "swiper/css/keyboard";
import { A11y, Autoplay, EffectCreative, Keyboard } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import { Swiper, SwiperSlide } from "swiper/vue";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useEdgeLuminance } from "../../composables/useEdgeLuminance";
import { useI18n } from "../../composables/useI18n";
import { usePictureList } from "../../composables/usePictureList";
import { useTheme } from "../../composables/useTheme";
import { isSwiperSupported } from "../../platform/advanced-feat-support";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";

// =========================================================================
// Types
// =========================================================================

// =========================================================================
// State
// =========================================================================

/** Picture-list group id consumed by this carousel. */
const GROUP_ID = "carousel-illustration";

/** Swiper v14 module set used by this carousel. */
const modules = [Autoplay, EffectCreative, Keyboard, A11y];

/** Whether the interactive carousel can run (static fallback otherwise). */
const isSupported = isSwiperSupported();

/** Autoplay delay (ms) — preserved from the old BCarousel. */
const AUTOPLAY_DELAY = 6000;

/** Reduced-motion preference: autoplay is not started by default. */
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/** Swiper instance (from the `@swiper` event) — shallowRef avoids unwrap. */
const swiper = shallowRef<SwiperClass | null>(null);

/** Whether autoplay is currently running (synced from Swiper events). */
const isPlaying = ref(false);

/** Real index of the active slide (0-based). */
const activeIndex = ref(0);

/** Autoplay countdown fill for the active bar (0–1, elapsed fraction). */
const progressElapsed = ref(0);

/** URL of the active image (drives edge-luminance detection). */
const luminanceSrc = ref<string | null>(null);

const { isDark } = useEdgeLuminance(luminanceSrc);

const { t } = useI18n();
const { effectiveTheme } = useTheme();

// -------------------------------------------------------------------------
// Config-driven slides (picture-list, group `carousel-illustration`)
// -------------------------------------------------------------------------

const { groups } = usePictureList(ref("index"));

/** Slides of the `carousel-illustration` group (empty while loading). */
const slides = computed(
  () => groups.value?.find((g) => g.id === GROUP_ID)?.contents ?? [],
);

/** Slide currently active (real index — no loop, so index === realIndex). */
const currentSlide = computed(() => slides.value[activeIndex.value] ?? null);

/** Related link of the active slide (used by the controls group). */
const currentLink = computed(() => currentSlide.value?.relatedLink ?? null);

// -------------------------------------------------------------------------
// Swiper params
// -------------------------------------------------------------------------

/** Autoplay config — the play/pause button is the single switch. */
const autoplayConfig = {
  delay: AUTOPLAY_DELAY,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
};

/** Creative-effect config (placeholders — tune after usability test). */
const creativeEffect = {
  prev: { translate: ["-18%", 0, -1], opacity: 0 },
  next: { translate: ["18%", 0, -1], opacity: 0 },
  limitProgress: 1,
};

/** Fill width of the active bar: full when paused/stopped. */
const displayedElapsed = computed(() =>
  isPlaying.value ? progressElapsed.value : 1,
);

// =========================================================================
// Actions
// =========================================================================

/**
 * Countdown-fill style for one bar — only the ACTIVE bar carries the fill.
 *
 * @param index - Bar/slide index.
 * @returns `scaleX` style, or `undefined` for inactive bars.
 */
function barFillStyle(index: number): { transform: string } | undefined {
  if (index !== activeIndex.value) return undefined;
  return { transform: `scaleX(${displayedElapsed.value})` };
}

/** Toggle autoplay via the Swiper instance (single source of truth). */
function togglePlay(): void {
  const instance = swiper.value;
  if (!instance) return;
  if (isPlaying.value) {
    instance.autoplay.pause();
  } else {
    instance.autoplay.resume();
  }
}

/** Jump to a slide via its index. */
function goToSlide(index: number): void {
  swiper.value?.slideTo(index);
}

/**
 * Re-read the active image URL for edge-luminance detection.
 * Guards against stale/destroyed instances (e.g. after HMR).
 */
function readActiveSrc(instance: SwiperClass): void {
  void nextTick(() => {
    if (instance.destroyed) return;
    const img = instance.slides?.[instance.activeIndex]?.querySelector("img");
    luminanceSrc.value = img?.currentSrc || img?.src || null;
  });
}

/** Swiper instance handler — syncs autoplay state + first source read. */
function onSwiper(instance: SwiperClass): void {
  swiper.value = instance;
  if (prefersReducedMotion) {
    instance.autoplay.stop();
    isPlaying.value = false;
  } else {
    isPlaying.value = instance.autoplay.running;
  }
  activeIndex.value = instance.activeIndex;
  readActiveSrc(instance);
}

function onSlideChange(instance: SwiperClass): void {
  activeIndex.value = instance.activeIndex;
  progressElapsed.value = 0;
  readActiveSrc(instance);
}

function onAutoplayStart(): void {
  isPlaying.value = true;
  progressElapsed.value = 0;
}

function onAutoplayStop(): void {
  isPlaying.value = false;
}

function onAutoplayPause(): void {
  isPlaying.value = false;
}

function onAutoplayResume(): void {
  isPlaying.value = true;
  progressElapsed.value = 0;
}

/** Continuous countdown: percentage is the REMAINING fraction (1 → 0). */
function onAutoplayTimeLeft(
  _swiper: SwiperClass,
  _timeLeft: number,
  percentage: number,
): void {
  progressElapsed.value = 1 - percentage;
}

// Theme switch swaps the follow-theme sources (slide 0) — re-detect.
watch(effectiveTheme, () => {
  if (swiper.value) readActiveSrc(swiper.value);
});
</script>

<template>
  <!-- ==== Interactive carousel (supported browsers + slides loaded) ==== -->
  <div
    v-if="isSupported && slides.length > 0"
    class="illustration-carousel"
    :class="
      isDark === true ? 'controls-on-image-dark' : 'controls-on-image-light'
    "
  >
    <Swiper
      :modules="modules"
      :rewind="true"
      :speed="600"
      effect="creative"
      :creative-effect="creativeEffect"
      :autoplay="autoplayConfig"
      :keyboard="{ enabled: true }"
      :a11y="{ enabled: true }"
      :lazy-preload="false"
      class="hero-swiper"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
      @autoplay-start="onAutoplayStart"
      @autoplay-stop="onAutoplayStop"
      @autoplay-pause="onAutoplayPause"
      @autoplay-resume="onAutoplayResume"
      @autoplay-time-left="onAutoplayTimeLeft"
    >
      <SwiperSlide v-for="slide in slides" :key="slide.id">
        <FeatureAwarePicture
          v-bind="slide.pictureProps"
          :alt="slide.pictureProps.alt ?? t(`text-${slide.id}-alt`)"
          class="d-block w-100 h-100 no-copy solid-bg"
        />
      </SwiperSlide>
    </Swiper>

    <!-- ==== Controls group (play/pause + bars + related link) ==== -->
    <div class="carousel-controls">
      <button
        type="button"
        class="carousel-play-toggle"
        :aria-label="
          isPlaying ? t('text-carousel-pause') : t('text-carousel-play')
        "
        @click="togglePlay"
      >
        <i
          :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"
          aria-hidden="true"
        ></i>
      </button>

      <div class="carousel-bars">
        <button
          v-for="(slide, i) in slides"
          :key="slide.id"
          type="button"
          class="carousel-bar"
          :class="{ active: i === activeIndex }"
          :aria-label="t('text-carousel-go-to-slide', [String(i + 1)])"
          :aria-current="i === activeIndex ? 'true' : undefined"
          @click="goToSlide(i)"
        >
          <span class="carousel-bar-fill" :style="barFillStyle(i)"></span>
        </button>
      </div>

      <TypeAwareLink
        v-if="currentLink"
        v-bind="currentLink"
        hide-indicator
        class="carousel-related-link"
        :aria-label="t('text-open-related-page')"
      >
        <i class="bi bi-link-45deg" aria-hidden="true"></i>
      </TypeAwareLink>
    </div>
  </div>

  <!-- ==== Static fallback (unsupported browsers / no-JS) ==== -->
  <div v-else class="illustration-carousel illustration-carousel-static">
    <template v-if="slides[0]">
      <FeatureAwarePicture
        v-bind="slides[0].pictureProps"
        :alt="slides[0].pictureProps.alt ?? t(`text-${slides[0].id}-alt`)"
        class="d-block w-100 h-100 no-copy solid-bg"
      />
      <TypeAwareLink
        v-if="slides[0].relatedLink"
        v-bind="slides[0].relatedLink"
        hide-indicator
        class="carousel-related-link"
        :aria-label="t('text-open-related-page')"
      >
        <i class="bi bi-link-45deg" aria-hidden="true"></i>
      </TypeAwareLink>
    </template>
  </div>
</template>

<style scoped>
/* ==== Carousel - Swiper hero carousel ==== */

.illustration-carousel {
  /* --- Control colors (adaptive: overridden by .controls-on-image-dark) --- */
  --shlh-carousel-control-color: var(--bs-body-color);
  --shlh-carousel-control-bg: rgba(var(--bs-body-bg-rgb), 0.72);
  --shlh-carousel-bar-bg: rgba(var(--bs-body-color-rgb), 0.35);
  --shlh-carousel-bar-fill: var(--bs-body-color);
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: var(--bs-border-radius);
  overflow: hidden;
}

.illustration-carousel.controls-on-image-dark {
  --shlh-carousel-control-color: #fff;
  --shlh-carousel-control-bg: rgba(0, 0, 0, 0.55);
  --shlh-carousel-bar-bg: rgba(255, 255, 255, 0.35);
  --shlh-carousel-bar-fill: #fff;
}

/* --- Controls group (play/pause + bars + related link) --- */

.carousel-controls {
  position: absolute;
  bottom: 0.9rem;
  left: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Square 1rem buttons (hidden until the expanded state). */
.carousel-play-toggle,
.carousel-related-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  padding: 0;
  border: 0;
  border-radius: 0.25rem;
  background: var(--shlh-carousel-control-bg);
  color: var(--shlh-carousel-control-color);
  text-decoration: none;
  font-size: 0.7rem;
  line-height: 1;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.1s ease,
    visibility 0.1s ease;
  cursor: pointer;
}

/* --- Per-slide long bars (countdown embedded) --- */

.carousel-bars {
  flex: 1 1 0;
  display: flex;
  gap: 0.35rem;
  min-width: 0;
}

.carousel-bar {
  flex: 1 1 0;
  height: 0.25rem;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: var(--shlh-carousel-bar-bg);
  opacity: 0.5;
  cursor: pointer;
  overflow: hidden;
  transition:
    height 0.1s ease,
    opacity 0.2s ease;
}

.carousel-bar.active {
  opacity: 1;
}

.carousel-bar-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--shlh-carousel-bar-fill);
  transform-origin: left center;
  transform: scaleX(0);
}
</style>

<style>
/* ==== Swiper internals + expanded-control state (prefixed) ==== */

.illustration-carousel .hero-swiper,
.illustration-carousel .swiper-wrapper,
.illustration-carousel .swiper-slide {
  height: 100%;
}

.illustration-carousel .swiper-slide {
  overflow: hidden;
}

.illustration-carousel .swiper-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --- Expanded state: hover (pointer), keyboard modality, touch --- */

.illustration-carousel:hover .carousel-bar {
  height: 1rem;
}

.illustration-carousel:hover .carousel-play-toggle,
.illustration-carousel:hover .carousel-related-link {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

html.user-input-keyboard .illustration-carousel .carousel-bar {
  height: 1rem;
}

html.user-input-keyboard .illustration-carousel .carousel-play-toggle,
html.user-input-keyboard .illustration-carousel .carousel-related-link {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

@media (hover: none) {
  .illustration-carousel .carousel-bar {
    height: 1rem;
  }

  .illustration-carousel .carousel-play-toggle,
  .illustration-carousel .carousel-related-link {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }
}

/* --- Static fallback related-link: always visible --- */

.illustration-carousel-static .carousel-related-link {
  position: absolute;
  bottom: 0.9rem;
  right: 0.75rem;
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

/* --- Reduced motion: neutralize transform transitions --- */

@media (prefers-reduced-motion: reduce) {
  .illustration-carousel .swiper-wrapper,
  .illustration-carousel .swiper-slide {
    transition: none !important;
  }
}
</style>
