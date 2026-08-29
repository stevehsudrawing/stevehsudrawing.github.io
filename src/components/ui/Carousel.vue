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
import { useI18n } from "../../composables/useI18n";
import { usePictureList } from "../../composables/usePictureList";
import { useTheme } from "../../composables/useTheme";
import { isSwiperSupported } from "../../platform/advanced-feat-support";
import { isImageBottomBandDark } from "../../platform/image-luminance";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";

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

/** URL of the active image (drives bottom-band luminance detection). */
const luminanceSrc = ref<string | null>(null);

/** `true` = dark bottom edge → white controls; `null` while loading. */
const isDark = ref<boolean | null>(null);

// Reactive luminance detection — bottom band of the active image only
// (inlined from the former useEdgeLuminance composable; the sampling
// lives in platform/image-luminance.ts, the math in core/).
watch(
  luminanceSrc,
  (src) => {
    isDark.value = null;
    if (!src) return;
    const token = src;
    void isImageBottomBandDark(src).then((dark) => {
      // Ignore stale results after a rapid slide change.
      if (luminanceSrc.value === token) isDark.value = dark;
    });
  },
  { immediate: true },
);

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
// Swiper params (static — created once per component instance)
// -------------------------------------------------------------------------

/** Autoplay config — the play/pause button is the single switch. */
const AUTOPLAY_CONFIG = {
  delay: AUTOPLAY_DELAY,
  disableOnInteraction: false,
  pauseOnMouseEnter: true,
};

/** Creative-effect config (placeholders — tune after usability test). */
const CREATIVE_EFFECT = {
  prev: { translate: ["-18%", 0, -1], opacity: 0 },
  next: { translate: ["18%", 0, -1], opacity: 0 },
  limitProgress: 1,
};

/** Keyboard module config (arrow keys navigate). */
const KEYBOARD_CONFIG = { enabled: true };

/** A11y module config (ARIA region / labels). */
const A11Y_CONFIG = { enabled: true };

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
      :creative-effect="CREATIVE_EFFECT"
      :autoplay="AUTOPLAY_CONFIG"
      :keyboard="KEYBOARD_CONFIG"
      :a11y="A11Y_CONFIG"
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
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: var(--bs-border-radius);
  overflow: hidden;
}

/* --- Control palettes: THEME-INDEPENDENT, image-bottom-edge driven --- */
/* Bright bottom edge -> black controls; dark bottom edge -> white. */

/* NOTE: hover uses `filter: invert(1)` — valid ONLY while these
   palettes stay pure #000/#fff (see docs/todos/v3.12.0.md §15.2). */

.illustration-carousel.controls-on-image-light {
  --shlh-carousel-control-color: #fff;
  --shlh-carousel-control-bg: #000;
  --shlh-carousel-bar-bg: rgba(0, 0, 0, 0.3);
  --shlh-carousel-bar-fill: #000;
}

.illustration-carousel.controls-on-image-dark {
  --shlh-carousel-control-color: #000;
  --shlh-carousel-control-bg: #fff;
  --shlh-carousel-bar-bg: rgba(255, 255, 255, 0.3);
  --shlh-carousel-bar-fill: #fff;
}

/* --- Controls group (play/pause + bars + related link) --- */

/* Bottom-anchored: bars hug the bottom edge and grow UPWARD on
   expand (flex-end aligns the whole group to the 1px bottom line). */
.carousel-controls {
  position: absolute;
  bottom: 1px;
  left: 1px;
  right: 1px;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  gap: 1px;
}

/* 1.5rem-square end buttons — width 0 until the expanded state (the
   bars then span the full group width). */
.carousel-play-toggle,
.carousel-related-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--shlh-carousel-control-bg);
  color: var(--shlh-carousel-control-color);
  text-decoration: none;
  font-size: 0.75rem;
  line-height: 1;
  overflow: hidden;
  pointer-events: none;
  transition:
    width 0.1s ease,
    filter 0.1s ease;
  cursor: pointer;
}

/* Hover / active / keyboard-focus inversion via pixel invert (see the
   palette note: pure #000/#fff only). */
.carousel-play-toggle:hover,
.carousel-play-toggle:active,
.carousel-play-toggle:focus-visible,
.carousel-related-link:hover,
.carousel-related-link:active,
.carousel-related-link:focus-visible {
  filter: invert(1);
}

/* --- Per-slide long bars (countdown embedded) --- */

.carousel-bars {
  flex: 1 1 0;
  display: flex;
  gap: 1px;
  min-width: 0;
}

.carousel-bar {
  flex: 1 1 0;
  height: 0.25rem;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--shlh-carousel-bar-bg);
  cursor: pointer;
  overflow: hidden;
  transition:
    height 0.1s ease,
    filter 0.1s ease;
}

/* Hover inversion: the whole bar inverts (track + fill, incl. the
   active progress) — same pixel-invert approach as the end buttons. */
.carousel-bar:hover {
  filter: invert(1);
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
/* End buttons expand by width (gradual squeeze of the bars), not opacity. */

.illustration-carousel:hover .carousel-bar {
  height: 1.5rem;
}

.illustration-carousel:hover .carousel-play-toggle,
.illustration-carousel:hover .carousel-related-link {
  width: 1.5rem;
  pointer-events: auto;
}

html.user-input-keyboard .illustration-carousel .carousel-bar {
  height: 1.5rem;
}

html.user-input-keyboard .illustration-carousel .carousel-play-toggle,
html.user-input-keyboard .illustration-carousel .carousel-related-link {
  width: 1.5rem;
  pointer-events: auto;
}

@media (hover: none) {
  .illustration-carousel .carousel-bar {
    height: 1.5rem;
  }

  .illustration-carousel .carousel-play-toggle,
  .illustration-carousel .carousel-related-link {
    width: 1.5rem;
    pointer-events: auto;
  }
}

/* --- Static fallback related-link: always visible (1.5rem wide) --- */

.illustration-carousel-static .carousel-related-link {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 1.5rem;
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
