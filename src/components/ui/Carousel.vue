<!--
  Carousel.vue — Hero illustration carousel (IndexPage).

  Swiper v14 replacement for the old BCarousel + BCarouselSlide:
    - Effect creative transition, `rewind` mode (loop breaks creative
      progress — see docs/todos/v3.12.0.md §13)
    - Autoplay state derived from the Swiper instance (no drift)
    - Pool-driven slides from `src/configs/picture-groups.json` via the
      `picGroupId` prop (picture ids are resolved through the registry)
    - One controls group: play/pause + per-slide countdown bars +
      preview button (expanded on hover / always for keyboard+touch) —
      the preview opens the single-image lightbox, where the ALT
      description and the slide's related link live
    - Adaptive control color from the active image's edge luminance

  Unsupported browsers (Swiper v14 baseline) and a disabled
  `enableSwiper` preference — both resolved by `useSwiperMode()` — get
  a static first-slide fallback (no-JS environments included): a single
  FeatureAwarePicture carrying the picture's own overlay controls (ALT +
  preview) and its `relatedLink`.
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
import { usePictureRegistry } from "../../composables/usePictureRegistry";
import { usePictureViewer } from "../../composables/usePictureViewer";
import { useSwiperMode } from "../../composables/useSwiperMode";
import { useTheme } from "../../composables/useTheme";
import { isImageEdgeDark } from "../../platform/image-luminance";
import type { FeatureAwarePictureProps } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Group pool id consumed by this carousel (e.g. "carousel-illustration"). */
  picGroupId: string;
}>();

// =========================================================================
// State
// =========================================================================

/** Swiper v14 module set used by this carousel. */
const modules = [Autoplay, EffectCreative, Keyboard, A11y];

/**
 * Whether the interactive carousel runs — the browser capability AND
 * the live `enableSwiper` preference (static fallback otherwise).
 */
const { swiperEnabled } = useSwiperMode();

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

/** Whether OUR hover currently paused autoplay (vs. the user's pause). */
const hoverPaused = ref(false);

/** True while a slide transition is running (bar activate is deferred). */
const isTransitioning = ref(false);

/** Old active index (the bar that drains during the transition). */
const prevActiveIndex = ref(-1);

/** Fill fraction captured at transition start (drain animation start). */
const shrinkingFrom = ref(0);

// Reactive luminance detection — bottom band of the active image only
// (inlined from the former useEdgeLuminance composable; the sampling
// lives in platform/image-luminance.ts, the math in core/).
watch(
  luminanceSrc,
  (src) => {
    isDark.value = null;
    if (!src) return;
    const token = src;
    void isImageEdgeDark(src, { edge: "bottom", ratio: 0.05 }).then((dark) => {
      // Ignore stale results after a rapid slide change.
      if (luminanceSrc.value === token) isDark.value = dark;
    });
  },
  { immediate: true },
);

const { t } = useI18n();
const { effectiveTheme } = useTheme();
const { openPictureViewer } = usePictureViewer();

// -------------------------------------------------------------------------
// Pool-driven slides (resolved through the registry)
// -------------------------------------------------------------------------

const { findGroup } = usePictureList();
const { pictureProps } = usePictureRegistry();

/** Picture ids of this carousel's group (empty while the pool loads). */
const slides = computed(() => findGroup(props.picGroupId)?.contents ?? []);

/** Id of the slide currently active (loop maps activeIndex → realIndex). */
const currentSlide = computed(() => slides.value[activeIndex.value] ?? null);

/**
 * Display props of ONE slide — the registry's identity plus the carousel's
 * own display policy (the first slide loads eagerly with a high fetch
 * priority, every other slide lazily).
 */
function slideProps(id: string, index: number): FeatureAwarePictureProps {
  return pictureProps(id, {
    fetchpriority: index === 0 ? "high" : undefined,
    loading: index === 0 ? undefined : "lazy",
  });
}

// -------------------------------------------------------------------------
// Swiper params (static — created once per component instance)
// -------------------------------------------------------------------------

/** Autoplay config — the play/pause button is the single switch.
 *  Hover pause is managed by the component (see pointer handlers) —
 *  Swiper's `pauseOnMouseEnter` binds to `swiper.el` only and would
 *  resume while hovering the sibling controls group. */
const AUTOPLAY_CONFIG = {
  delay: AUTOPLAY_DELAY,
  disableOnInteraction: false,
};

/** Creative-effect config. */
const CREATIVE_EFFECT = {
  prev: {
    translate: [0, 0, -400],
  },
  next: {
    translate: ["100%", 0, 0],
  },
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
 * The DRAINING bar (previous active) is styled by the CSS animation
 * instead (no inline transform).
 *
 * @param index - Bar/slide index.
 * @returns `scaleX` style, or `undefined` for inactive/draining bars.
 */
function barFillStyle(index: number): { transform: string } | undefined {
  if (isTransitioning.value && index === prevActiveIndex.value) {
    return undefined;
  }
  if (index !== activeIndex.value) return undefined;
  return { transform: `scaleX(${displayedElapsed.value})` };
}

/**
 * Drain-animation start value for a bar via a CSS custom property.
 *
 * @param index - Bar/slide index.
 * @returns `--shlh-carousel-drain-from` style, or `undefined`.
 */
function drainStyle(index: number): Record<string, string> | undefined {
  if (!isTransitioning.value || index !== prevActiveIndex.value) {
    return undefined;
  }
  return { "--shlh-carousel-drain-from": String(shrinkingFrom.value) };
}

/** Toggle autoplay via the Swiper instance (single source of truth). */
function togglePlay(): void {
  const instance = swiper.value;
  if (!instance) return;
  // A manual toggle supersedes any hover-paused state.
  hoverPaused.value = false;
  if (isPlaying.value) {
    instance.autoplay.pause();
  } else {
    instance.autoplay.resume();
  }
}

/**
 * Pointer entered the whole carousel (swiper + controls): pause while
 * hovering — but only if autoplay was already running, so a manual
 * pause is never overridden on leave.
 */
function onPointerEnter(event: PointerEvent): void {
  if (event.pointerType !== "mouse") return;
  if (isPlaying.value) {
    hoverPaused.value = true;
    swiper.value?.autoplay.pause();
  } else {
    hoverPaused.value = false;
  }
}

/** Pointer left the whole carousel: resume only our own hover pause. */
function onPointerLeave(event: PointerEvent): void {
  if (event.pointerType !== "mouse") return;
  if (hoverPaused.value) {
    hoverPaused.value = false;
    swiper.value?.autoplay.resume();
  }
}

/** Jump to a slide via its real index (loop-safe). */
function goToSlide(index: number): void {
  swiper.value?.slideToLoop(index);
}

/**
 * Preview click — open the single-image lightbox for one slide (the
 * active slide from the controls group, the first slide from the static
 * fallback branch).
 */
function onPreviewClick(pictureId: string | null | undefined): void {
  if (!pictureId) return;
  openPictureViewer(pictureProps(pictureId));
}

/**
 * Re-read the active image URL for edge-luminance detection.
 * Guards against stale/destroyed instances (e.g. after HMR).
 * Loop mode reorders the slide DOM nodes, so the real index is mapped
 * via Swiper's `data-swiper-slide-index` attribute (same mechanism
 * Swiper core uses in slideToLoop), NOT by array position.
 */
function readActiveSrc(instance: SwiperClass): void {
  void nextTick(() => {
    if (instance.destroyed) return;
    const slideEl =
      instance.slides?.find(
        (el) =>
          el.getAttribute("data-swiper-slide-index") ===
          String(instance.realIndex),
      ) ?? instance.slides?.[instance.realIndex];
    const img = slideEl?.querySelector("img");
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
  activeIndex.value = instance.realIndex;
  readActiveSrc(instance);
}

function onSlideChange(instance: SwiperClass): void {
  // Ignore init / loopFix noise: a real transition always changes the
  // real index (the no-animation initial slideChange has the same one).
  if (instance.realIndex === activeIndex.value) return;
  // Transition START: keep the OLD bar active and let its fill drain
  // away (shrinkingFrom → 0) during the transition; the TARGET bar is
  // activated on transition end (see onSlideChangeTransitionEnd).
  // loop mode keeps activeIndex as the physical index — use realIndex
  // when activating.
  shrinkingFrom.value = displayedElapsed.value;
  prevActiveIndex.value = activeIndex.value;
  isTransitioning.value = true;
}

function onSlideChangeTransitionEnd(instance: SwiperClass): void {
  // Transition END: activate the target bar. progressElapsed keeps the
  // real elapsed time (timer re-armed at slide change), so the new fill
  // continues seamlessly — no timer manipulation.
  activeIndex.value = instance.realIndex;
  isTransitioning.value = false;
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

// Disabling Swiper unmounts the Swiper branch — clear the transient
// state so nothing reads a destroyed instance (the theme watcher above
// included) and a later re-enable starts fresh.
watch(swiperEnabled, (enabled) => {
  if (enabled) return;
  swiper.value = null;
  isPlaying.value = false;
  progressElapsed.value = 0;
  isTransitioning.value = false;
  prevActiveIndex.value = -1;
  hoverPaused.value = false;
});
</script>

<template>
  <!-- ==== Interactive carousel (supported browsers + slides loaded) ==== -->
  <div
    v-if="swiperEnabled && slides.length > 0"
    class="illustration-carousel"
    :class="
      isDark === true ? 'controls-on-image-dark' : 'controls-on-image-light'
    "
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <Swiper
      :modules="modules"
      :loop="true"
      :speed="600"
      :grabCursor="true"
      effect="creative"
      :creative-effect="CREATIVE_EFFECT"
      :autoplay="AUTOPLAY_CONFIG"
      :keyboard="KEYBOARD_CONFIG"
      :a11y="A11Y_CONFIG"
      :lazy-preload="false"
      class="hero-swiper"
      @swiper="onSwiper"
      @slide-change="onSlideChange"
      @slide-change-transition-end="onSlideChangeTransitionEnd"
      @autoplay-start="onAutoplayStart"
      @autoplay-stop="onAutoplayStop"
      @autoplay-pause="onAutoplayPause"
      @autoplay-resume="onAutoplayResume"
      @autoplay-time-left="onAutoplayTimeLeft"
    >
      <SwiperSlide v-for="(slideId, i) in slides" :key="slideId">
        <FeatureAwarePicture
          v-bind="slideProps(slideId, i)"
          class="d-block w-100 h-100 no-copy solid-bg"
        />
      </SwiperSlide>
    </Swiper>

    <!-- ==== Controls group (play/pause + bars + preview) ==== -->
    <div class="carousel-controls">
      <button
        type="button"
        class="carousel-play-toggle"
        :aria-label="
          isPlaying ? t('text-carousel-pause') : t('text-carousel-play')
        "
        @click="togglePlay"
      >
        <MaterialSymbol :name="isPlaying ? 'pause' : 'play_arrow'" />
      </button>

      <div class="carousel-bars">
        <button
          v-for="(slideId, i) in slides"
          :key="slideId"
          type="button"
          class="carousel-bar"
          :class="{
            active: i === activeIndex,
            draining: isTransitioning && i === prevActiveIndex,
          }"
          :style="drainStyle(i)"
          :aria-label="t('text-carousel-go-to-slide', [String(i + 1)])"
          :aria-current="i === activeIndex ? 'true' : undefined"
          @click="goToSlide(i)"
        >
          <span class="carousel-bar-fill" :style="barFillStyle(i)"></span>
        </button>
      </div>

      <button
        type="button"
        class="carousel-preview-btn"
        :aria-label="t('text-image-preview')"
        @click="onPreviewClick(currentSlide)"
      >
        <MaterialSymbol name="zoom_in" />
      </button>
    </div>
  </div>

  <!-- ==== Static fallback (unsupported browsers / no-JS) ==== -->
  <div v-else class="illustration-carousel illustration-carousel-static">
    <template v-if="slides[0]">
      <FeatureAwarePicture
        v-bind="slideProps(slides[0], 0)"
        show-alt-button
        previewable
        class="d-block w-100 h-100 no-copy solid-bg"
      />
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

/* --- Control palettes: shared global stylesheet (on-image-controls.css) ---
   The `.controls-on-image-light/dark` classes + `--shlh-on-image-*`
   variables are defined globally (consumed by Carousel and the Gallery
   picture viewer fallback arrows).  Pure #000/#fff contract — see that
   file. */

/* --- Controls group (play/pause + bars + preview) --- */

/* Bottom-anchored, SINGLE animation source: the group itself animates
   height 0.25rem → 1.5rem (grows upward from the 1px bottom line); bars
   and buttons are height: 100% and follow it. */
.carousel-controls {
  position: absolute;
  bottom: 1px;
  left: 1px;
  right: 1px;
  z-index: 10;
  display: flex;
  align-items: flex-end;
  gap: 1px;
  height: 0.25rem;
  transition: height var(--shlh-duration-fast) ease;
}

/* End buttons: 0.25rem collapsed squares (same look as the bar track),
   growing from their corners to 1.5rem on expand. */
.carousel-play-toggle,
.carousel-preview-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.25rem;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--shlh-on-image-bar-bg);
  color: var(--shlh-on-image-control-color);
  text-decoration: none;
  font-size: 0.75rem;
  line-height: 1;
  overflow: hidden;
  pointer-events: none;
  backdrop-filter: blur(var(--shlh-blur-sm));
  transition:
    width var(--shlh-duration-fast) ease,
    background-color var(--shlh-duration-fast) ease,
    filter var(--shlh-duration-fast) ease;
  cursor: pointer;
}

.carousel-play-toggle {
  transform-origin: left bottom;
}

.carousel-preview-btn {
  transform-origin: right bottom;
}

/* Icon hidden while collapsed; fades in on expand (opacity set in the
   expanded-state rules). */
.carousel-play-toggle > .material-symbols-outlined,
.carousel-preview-btn > .material-symbols-outlined {
  opacity: 0;
  transition: opacity var(--shlh-duration-fast) ease;
}

/* Hover / active / keyboard-focus inversion via pixel invert (see the
   palette note: pure #000/#fff only). */
.carousel-play-toggle:hover,
.carousel-play-toggle:active,
.carousel-play-toggle:focus-visible,
.carousel-preview-btn:hover,
.carousel-preview-btn:active,
.carousel-preview-btn:focus-visible {
  filter: invert(1);
}

/* --- Per-slide long bars (countdown embedded) --- */

.carousel-bars {
  flex: 1 1 0;
  height: 100%;
  display: flex;
  gap: 1px;
  min-width: 0;
}

.carousel-bar {
  flex: 1 1 0;
  height: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: var(--shlh-on-image-bar-bg);
  backdrop-filter: blur(var(--shlh-blur-sm));
  cursor: pointer;
  overflow: hidden;
  transition: filter var(--shlh-duration-fast) ease;
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
  background: var(--shlh-on-image-bar-fill);
  transform-origin: left center;
  transform: scaleX(0);
}

/* forced-colors: the fill would be forced to `Canvas` (only marginally
   distinguishable from the translucent track); a system color keeps the
   countdown readable. */
@media (forced-colors: active) {
  .carousel-bar-fill {
    background-color: CanvasText;
  }
}

/* During a slide transition the previous bar's fill drains away in
   the OPPOSITE direction of filling: fill grows left→right (left edge
   fixed), so it drains with the RIGHT edge fixed — the left part
   recedes first. Mirrors the Swiper transition duration (speed 600). */
.carousel-bar.draining .carousel-bar-fill {
  transform-origin: right center;
  animation: shlh-carousel-drain 0.6s linear forwards;
}

@keyframes shlh-carousel-drain {
  from {
    transform: scaleX(var(--shlh-carousel-drain-from, 1));
  }

  to {
    transform: scaleX(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .carousel-bar.draining .carousel-bar-fill {
    animation: none;
  }
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
/* ONE source: the group height animates; buttons widen and fade in. */

.illustration-carousel:hover .carousel-controls {
  height: 1.5rem;
}

.illustration-carousel:hover .carousel-play-toggle,
.illustration-carousel:hover .carousel-preview-btn {
  width: 1.5rem;
  pointer-events: auto;
  background: var(--shlh-on-image-control-bg);
}

.illustration-carousel:hover .carousel-play-toggle > .material-symbols-outlined,
.illustration-carousel:hover
  .carousel-preview-btn
  > .material-symbols-outlined {
  opacity: 1;
}

html.user-input-keyboard .illustration-carousel .carousel-controls {
  height: 1.5rem;
}

html.user-input-keyboard .illustration-carousel .carousel-play-toggle,
html.user-input-keyboard .illustration-carousel .carousel-preview-btn {
  width: 1.5rem;
  pointer-events: auto;
  background: var(--shlh-on-image-control-bg);
}

html.user-input-keyboard
  .illustration-carousel
  .carousel-play-toggle
  > .material-symbols-outlined,
html.user-input-keyboard
  .illustration-carousel
  .carousel-preview-btn
  > .material-symbols-outlined {
  opacity: 1;
}

@media (hover: none) {
  .illustration-carousel .carousel-controls {
    height: 1.5rem;
  }

  .illustration-carousel .carousel-play-toggle,
  .illustration-carousel .carousel-preview-btn {
    width: 1.5rem;
    pointer-events: auto;
    background: var(--shlh-on-image-control-bg);
  }

  .illustration-carousel .carousel-play-toggle > .material-symbols-outlined,
  .illustration-carousel .carousel-preview-btn > .material-symbols-outlined {
    opacity: 1;
  }
}

/* --- Static fallback: wrapper-aware sizing (the v3.14.2 hero pattern) --- */
/* With the overlay controls the picture is wrapped in
   `.feature-aware-picture` (inline-block, auto height), so the img's
   `h-100` loses its definite basis.  The wrapper chain is therefore
   pinned to the box and the img fills it with `object-fit: cover`.
   `>` combinators only — a descendant selector would also match the
   <picture> elements inside the Swiper slides. */

.illustration-carousel-static > .feature-aware-picture,
.illustration-carousel-static > .feature-aware-picture > picture,
.illustration-carousel-static > .feature-aware-picture > img {
  position: absolute;
  inset: 0;
}

.illustration-carousel-static > .feature-aware-picture > picture > img,
.illustration-carousel-static > .feature-aware-picture > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* --- Reduced motion: neutralize transform transitions --- */

@media (prefers-reduced-motion: reduce) {
  .illustration-carousel .swiper-wrapper,
  .illustration-carousel .swiper-slide {
    transition: none !important;
  }
}
</style>
