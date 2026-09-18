<!--
  PictureGroupViewerModal.vue — multi-image lightbox for the Gallery page
  (stack id `picture-group-viewer`; the single-image lightbox lives in
  PictureViewerModal.vue).  Uses the standard BModal chrome (consistent
  with QRCodeModal): the header title shows the picture description; the
  footer has QR-share / related-link / Back (conditional) / Close.
  Navigation:
    - Swiper coverflow stage (supported browsers with `enableSwiper`
      on): click a side image to switch (slideToClickedSlide), keyboard
      arrows + touch swipe via Swiper; bottom-center fraction
      indicator; a modality hint (swipe / drag, or arrow keys) that
      fades out on its own.
    - Static fallback (old browsers or the preference off): centred
      current picture with the restored dir-aware slide Transition +
      looping chevron arrows flanking the stage + the same fraction;
      keyboard arrows via a window listener.
  Mobile (≤ 768 px): the slides grow to the stage width, which pushes the
  coverflow neighbours fully outside the stage — the picture is enlarged
  to the stage width or height.
  Preview-only: `.no-copy`, no download / open-original buttons.
  Open/close animation + backdrop come from base.css (Modal / .modal-backdrop).
-->
<script setup lang="ts">
import "swiper/css";
import "swiper/css/a11y";
import "swiper/css/effect-coverflow";
import "swiper/css/keyboard";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper/types";
import { Swiper, SwiperSlide } from "swiper/vue";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { setSwipeTrackingEnabled } from "../../composables/useGesture";
import { useI18n } from "../../composables/useI18n";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { usePictureRegistry } from "../../composables/usePictureRegistry";
import { useSwiperMode } from "../../composables/useSwiperMode";
import { normalizeInternalPath, preserveLangParam } from "../../core/utils";
import { isImageEdgeDark } from "../../platform/image-luminance";
import type {
  FeatureAwarePictureProps,
  TypeAwareImageProps,
  TypeAwareLinkProps,
} from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("picture-group-viewer");
const { push, pop, clear } = useModalStack();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

/**
 * Whether the interactive Swiper stage runs — the browser capability
 * AND the live `enableSwiper` preference (static fallback otherwise).
 */
const { swiperEnabled: isSwiper } = useSwiperMode();

/** Swiper v14 module set used by the coverflow stage. */
const modules = [EffectCoverflow, Keyboard, A11y];

/** Coverflow config (final values — side slides = part of the click
 *  affordance; see R4, no custom perspective). */
const COVERFLOW_EFFECT = {
  rotate: 50,
  stretch: 0,
  depth: 100,
  modifier: 1,
  slideShadows: false,
};

/** Keyboard module config (arrow keys navigate). */
const KEYBOARD_CONFIG = { enabled: true };

/** A11y module config (ARIA region / labels). */
const A11Y_CONFIG = { enabled: true };

// -------------------------------------------------------------------------
// Current picture (initialized from currentId, then navigated internally)
// -------------------------------------------------------------------------

const { pictureProps: resolvePicture } = usePictureRegistry();

/** Group id from the stack — written to `?picGroupId=` by the URL sync. */
const groupId = computed(() => stackProps.value?.groupId ?? "");

const contents = computed<string[]>(() => stackProps.value?.contents ?? []);

const index = ref(0);

/** Slide direction of the fallback Transition ("next" = enter from right). */
const dir = ref<"next" | "prev">("next");

watch(
  stackProps,
  (p) => {
    if (p && p.contents?.length) {
      const idx = p.contents.indexOf(p.currentId);
      index.value = idx >= 0 ? idx : 0;
    }
  },
  { immediate: true },
);

/** Identity of the current picture list (re-creates the Swiper). */
const contentsKey = computed(() => contents.value.join(","));

const current = computed<string | null>(
  () => contents.value[index.value] ?? null,
);

/**
 * Whether the navigation hint is rendered.  Swiper branch: at least two
 * pictures (with a single one there is nothing to switch).  Fallback
 * branch: always — its arrow-key hint is the only hint there.
 */
const hintsVisible = computed(() =>
  isSwiper.value ? contents.value.length > 1 : contents.value.length > 0,
);

// -------------------------------------------------------------------------
// Per-picture display props (identity comes from the registry)
// -------------------------------------------------------------------------

/** Stage props for one picture — registry identity + stage display keys. */
function picturePropsOf(pictureId: string): FeatureAwarePictureProps {
  // `aspectRatio` is a card-layer loading placeholder — the viewer
  // stage owns the displayed size (max-width: 72% + height: 100% +
  // object-fit: contain), so an inline aspect-ratio must not leak in.
  const { aspectRatio: _ignored, ...rest } = resolvePicture(pictureId);
  return {
    ...rest,
    // ALT button on the ACTIVE slide only — the side slides are partially
    // visible click affordances and four floating buttons would be noise.
    // The preview button never renders inside a lightbox.
    showAltButton: pictureId === current.value,
    previewable: false,
  } as FeatureAwarePictureProps;
}

/** Enlarged poster props of the CURRENT picture (fallback branch). */
const pictureProps = computed<FeatureAwarePictureProps | null>(() =>
  current.value ? picturePropsOf(current.value) : null,
);

// -------------------------------------------------------------------------
// Stage luminance (arrows: left/right; fraction: bottom) + stage fit
// -------------------------------------------------------------------------

/** Left-edge luminance of the current picture (`null` while unknown). */
const leftDark = ref<boolean | null>(null);

/** Right-edge luminance of the current picture (`null` while unknown). */
const rightDark = ref<boolean | null>(null);

/** Bottom-edge luminance of the current picture (fraction indicator). */
const bottomDark = ref<boolean | null>(null);

/** `.picture-slide-wrap` element (fallback <img> source lookup). */
const pictureWrapRef = ref<HTMLElement | null>(null);

/** `.picture-viewer-stage` element (active <img> lookup for sampling). */
const stageRef = ref<HTMLElement | null>(null);

/**
 * Rendered <img> of the CURRENT picture per branch (theme/lang resolved).
 */
function currentStageImg(): HTMLImageElement | null {
  const root = isSwiper.value ? stageRef.value : pictureWrapRef.value;
  if (!root) return null;
  return root.querySelector(
    isSwiper.value ? ".swiper-slide-active img" : "img",
  );
}

/**
 * Sample the current image's edges (stale-guard by the picture id):
 * left 10% + right 10% only in the fallback branch (arrows); bottom 10%
 * ALWAYS (fraction indicator).  Called after the initial mount and after
 * every slide change / fallback enter transition.
 */
function sampleStageLuminance(): void {
  void nextTick(() => {
    const img = currentStageImg();
    const src = img?.currentSrc || img?.src || null;
    if (!src) return;
    const tokenId = current.value;
    const apply =
      (edge: "left" | "right" | "bottom") =>
      (dark: boolean): void => {
        if (!tokenId || current.value !== tokenId) return;
        if (edge === "left") leftDark.value = dark;
        else if (edge === "right") rightDark.value = dark;
        else bottomDark.value = dark;
      };
    if (!isSwiper.value) {
      void isImageEdgeDark(src, { edge: "left", ratio: 0.1 }).then(
        apply("left"),
      );
      void isImageEdgeDark(src, { edge: "right", ratio: 0.1 }).then(
        apply("right"),
      );
    }
    void isImageEdgeDark(src, { edge: "bottom", ratio: 0.1 }).then(
      apply("bottom"),
    );
  });
}

/** Reset all luminance state before sampling a new picture. */
function resetStageLuminance(): void {
  leftDark.value = null;
  rightDark.value = null;
  bottomDark.value = null;
}

/** Swiper transition END: re-sample the stage luminance. */
function onSlideChangeEnd(): void {
  sampleStageLuminance();
}

// Fallback: sample after the out-in enter completes (a plain nextTick
// sees the leaving image); the Swiper branch is sampled by `onShown` +
// `@slide-change-transition-end`.
watch(
  pictureProps,
  () => {
    if (isSwiper.value) return;
    resetStageLuminance();
    void nextTick(() => sampleStageLuminance());
  },
  { immediate: true },
);

/** Picture title shown in the chrome bar (registry-resolved). */
const title = computed(() =>
  current.value ? (resolvePicture(current.value).title ?? "") : "",
);

/**
 * QR share-card title — the picture's resolved title plus the
 * localized `text-picture` label in HALF-WIDTH parentheses
 * (`Kato (Picture)` / `Kato (图片)`), in EVERY case (a configured
 * `relatedLink.icon` included); the icon's own alt no longer feeds the
 * card.  Falls back to the site name only when the title is empty.
 */
const qrTitle = computed(() =>
  title.value
    ? `${title.value} (${t("text-picture")})`
    : t("text-steve-hsu-s-link-hub"),
);

/**
 * QR centre icon — resolution: the picture's `relatedLink.icon` → the
 * default site signature.  NEVER the poster itself (keeps the full
 * artwork out of the share card).  The share-card title travels as the
 * icon's alt (computed in `qrTitle`).
 */
const qrIcon = computed<TypeAwareImageProps>(() => {
  const pictureId = current.value;
  const configured = pictureId
    ? resolvePicture(pictureId).relatedLink?.icon
    : undefined;
  if (configured) {
    if (configured.type === "picture") {
      return {
        type: "picture",
        imgProps: { ...configured.imgProps, alt: qrTitle.value },
      };
    }
    return {
      type: "colored-img",
      imgProps: { ...configured.imgProps, alt: qrTitle.value },
    };
  }
  // Default icon: site signature.
  return {
    type: "colored-img",
    imgProps: {
      src: "/images/webp/icons/steve-hsu.webp",
      colorVar: "bs-primary",
      alt: qrTitle.value,
    },
  };
});

/** Related link back to another page section (typed, on the picture props). */
const relatedLink = computed<TypeAwareLinkProps | null>(() =>
  current.value ? (resolvePicture(current.value).relatedLink ?? null) : null,
);

/**
 * Whether the viewer was entered via a cross-page navigation.  Vue Router
 * stores the previous entry's URL in `history.state.back`; comparing its
 * normalized path with the current page tells us whether a "Back" button
 * makes sense (returns to the original page) vs a plain Close (stay).
 *
 * `history.state` is NOT reactive — the computed re-evaluates whenever the
 * viewer (de)activates (`visible`), at which point `state.back` already
 * reflects the entry we were opened from.
 */
const cameFromAnotherPage = computed(() => {
  if (!visible.value) return false;
  const back = history.state?.back;
  if (typeof back !== "string" || !back) return false;
  try {
    const backPath = new URL(back, window.location.origin).pathname;
    return (
      normalizeInternalPath(backPath) !==
      normalizeInternalPath(window.location.pathname)
    );
  } catch {
    return false;
  }
});

// -------------------------------------------------------------------------
// QR share URL: canonical deep link of the current picture
// -------------------------------------------------------------------------

const shareUrl = computed(() => {
  const url = new URL(window.location.origin + window.location.pathname);
  if (groupId.value) url.searchParams.set("picGroupId", groupId.value);
  if (current.value) url.searchParams.set("picId", current.value);
  const lang = route.query.lang;
  if (typeof lang === "string" && lang) url.searchParams.set("lang", lang);
  return url.toString();
});

// =========================================================================
// Actions
// =========================================================================

/** Sync the `?picGroupId=` / `?picId=` deep link with the current picture. */
function syncViewerParams(): void {
  const id = current.value;
  if (!id) return;
  router.replace({
    query: preserveLangParam({
      ...route.query,
      picGroupId: groupId.value || undefined,
      picId: id,
    }),
  });
}

/**
 * Fallback navigation: looping prev/next (no Swiper).  Direction is set
 * BEFORE the index change (same render batch), so the leaving picture
 * reads the new direction for its exit animation.
 */
function fallbackGoTo(delta: number): void {
  const len = contents.value.length;
  if (len === 0) return;
  const target = (index.value + delta + len) % len;
  dir.value = target > index.value ? "next" : "prev";
  index.value = target;
  syncViewerParams();
}

/**
 * Swiper transition start — Swiper owns navigation; only update state when
 * the real index actually changed (loop reorders the slide DOM; ignore the
 * initial false slideChange) and mirror it to `?picId=`.
 */
function onSlideChange(instance: SwiperClass): void {
  if (instance.realIndex === index.value) return;
  index.value = instance.realIndex;
  syncViewerParams();
}

function showQR(): void {
  push({
    id: "qr-code",
    props: {
      url: shareUrl.value,
      icon: qrIcon.value,
      hideOpenLink: true,
    },
  });
}

/** Close the viewer: pop it and stay on the gallery page. */
function close(): void {
  pop();
}

/**
 * Back: return to the page we came from (only reachable when the viewer
 * was entered via a cross-page navigation — see `cameFromAnotherPage`).
 */
function goBack(): void {
  router.back();
}

/**
 * Related-link click — only INTERNAL links dismiss the overlay: the
 * viewer is about to be replaced by its destination page, so the whole
 * stack is cleared and the navigation is deferred to the next tick (the
 * viewer-close URL cleanup (the URL owner rewrites `router.replace`), runs in the
 * same flush and would otherwise cancel a synchronous push).
 *
 * External / email / anchor links keep the stack intact:
 * `TypeAwareLink`'s own handler (which runs first) pushes the
 * confirmation modal for external links — clearing here would remove the
 * modal it had just pushed — and handles the other types natively.
 */
function onRelatedLinkClick(): void {
  const link = relatedLink.value;
  if (!link || link.type !== "internal") return;
  clear();
  nextTick(() => router.push(link.href));
}

// ---- Keyboard (interactive: Swiper Keyboard module; fallback: window) ----

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    fallbackGoTo(-1);
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    fallbackGoTo(1);
  }
}

function onShown(): void {
  // The interactive branch uses Swiper's Keyboard module; the fallback
  // branch keeps this window listener.
  if (!isSwiper.value) window.addEventListener("keydown", onKeydown);
  // Fullscreen lightbox: suppress offcanvas edge-swipes while open.
  setSwipeTrackingEnabled(false);
  // Initial sampling for the Swiper branch (the setup-time watch fires
  // before the modal DOM exists).
  if (isSwiper.value) {
    resetStageLuminance();
    void nextTick(sampleStageLuminance);
  }
}

function onHidden(): void {
  window.removeEventListener("keydown", onKeydown);
  setSwipeTrackingEnabled(true);
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  setSwipeTrackingEnabled(true);
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="title"
    header-class="h5 modal-title"
    title-tag="span"
    size="xl"
    no-header-close
    centered
    @shown="onShown"
    @hidden="onHidden"
  >
    <!-- ==== Image stage (Swiper coverflow / static fallback) ==== -->
    <div
      ref="stageRef"
      class="picture-viewer-stage"
      :class="{ 'picture-viewer-stage-fallback': !isSwiper }"
    >
      <Swiper
        v-if="isSwiper && contents.length > 0"
        :key="contentsKey"
        :modules="modules"
        :initial-slide="index"
        effect="coverflow"
        :coverflow-effect="COVERFLOW_EFFECT"
        :centered-slides="true"
        :slides-per-view="'auto'"
        :loop="true"
        :speed="600"
        :grab-cursor="true"
        slide-to-clicked-slide
        :keyboard="KEYBOARD_CONFIG"
        :a11y="A11Y_CONFIG"
        class="picture-viewer-swiper"
        @slide-change="onSlideChange"
        @slide-change-transition-end="onSlideChangeEnd"
      >
        <SwiperSlide
          v-for="pictureId in contents"
          :key="pictureId"
          class="picture-viewer-slide"
        >
          <FeatureAwarePicture
            v-bind="picturePropsOf(pictureId)"
            class="picture-viewer-img no-copy"
          />
        </SwiperSlide>
      </Swiper>
      <Transition
        v-else-if="pictureProps"
        mode="out-in"
        enter-active-class="picture-slide-enter-active"
        leave-active-class="picture-slide-leave-active"
        :enter-from-class="
          dir === 'prev'
            ? 'picture-slide-enter-from-prev'
            : 'picture-slide-enter-from-next'
        "
        :leave-to-class="
          dir === 'prev'
            ? 'picture-slide-leave-to-prev'
            : 'picture-slide-leave-to-next'
        "
        @after-enter="sampleStageLuminance"
      >
        <div
          :key="current ?? ''"
          ref="pictureWrapRef"
          class="picture-slide-wrap"
        >
          <FeatureAwarePicture
            v-bind="pictureProps"
            class="picture-viewer-img no-copy"
          />
        </div>
      </Transition>

      <!-- ==== Fallback arrows (old browsers, flank the stage) ==== -->
      <TooltipTrigger v-if="!isSwiper" :title="t('text-previous-page')">
        <button
          type="button"
          class="btn btn-no-border picture-viewer-fallback-arrow picture-viewer-fallback-arrow-left"
          :class="
            leftDark === true
              ? 'controls-on-image-dark'
              : leftDark === false
                ? 'controls-on-image-light'
                : ''
          "
          :aria-label="$t('text-previous-page')"
          @click="fallbackGoTo(-1)"
        >
          <MaterialSymbol name="chevron_left" />
        </button>
      </TooltipTrigger>
      <TooltipTrigger v-if="!isSwiper" :title="t('text-next-page')">
        <button
          type="button"
          class="btn btn-no-border picture-viewer-fallback-arrow picture-viewer-fallback-arrow-right"
          :class="
            rightDark === true
              ? 'controls-on-image-dark'
              : rightDark === false
                ? 'controls-on-image-light'
                : ''
          "
          :aria-label="$t('text-next-page')"
          @click="fallbackGoTo(1)"
        >
          <MaterialSymbol name="chevron_right" />
        </button>
      </TooltipTrigger>

      <!-- ==== Navigation hints (modality-aware, self-fading) ==== -->
      <div
        v-if="hintsVisible"
        :key="visible ? 'open' : 'closed'"
        class="picture-viewer-hints"
        :class="[
          isSwiper ? '' : 'picture-viewer-hints--fallback',
          bottomDark === true
            ? 'controls-on-image-dark'
            : bottomDark === false
              ? 'controls-on-image-light'
              : '',
        ]"
        aria-hidden="true"
      >
        <span
          v-if="isSwiper"
          class="picture-viewer-hint picture-viewer-hint-swipe"
        >
          <MaterialSymbol name="swap_horiz" />
          {{ t("text-swipe-or-drag-to-switch") }}
        </span>
        <span class="picture-viewer-hint picture-viewer-hint-keys">
          <MaterialSymbol name="swap_horiz" />
          {{ t("text-use-arrow-keys-to-switch") }}
        </span>
      </div>

      <!-- ==== Fraction indicator (current / total) ==== -->
      <span
        class="picture-viewer-fraction"
        :class="
          bottomDark === true
            ? 'controls-on-image-dark'
            : bottomDark === false
              ? 'controls-on-image-light'
              : ''
        "
        aria-hidden="true"
      >
        {{ index + 1 }} / {{ contents.length }}
      </span>
    </div>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-share')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-share')"
            @click="showQR"
          >
            <MaterialSymbol name="share" />
          </button>
        </TooltipTrigger>
        <TooltipTrigger :title="t('text-open-related-page')">
          <TypeAwareLink
            v-if="relatedLink"
            v-bind="relatedLink"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-open-related-page')"
            hide-indicator
            @click="onRelatedLinkClick()"
          >
            <MaterialSymbol name="open_in_new" />
          </TypeAwareLink>
        </TooltipTrigger>
        <div class="ms-auto">
          <button
            v-if="cameFromAnotherPage"
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-back')"
            @click="goBack()"
          >
            {{ $t("text-back") }}
          </button>
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            @click="close()"
          >
            {{ $t("text-close") }}
          </button>
        </div>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* --- Image stage (Swiper coverflow / static fallback) --- */
/* NOTE: no custom `perspective` on the SHARED stage — Swiper ships
   `.swiper-3d { perspective: 1200px }`; a custom short perspective
   (e.g. 16rem) distorts the coverflow hit area.  The fallback branch
   gets its OWN perspective below. */
.picture-viewer-stage {
  position: relative;
  min-height: 50vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Fallback-only perspective: the restored slide Transition uses
   rotateY — without a container perspective it looks flat (no
   near/far depth).  Applies only when the Swiper stage is absent. */
.picture-viewer-stage-fallback {
  perspective: 16rem;
}

.picture-viewer-swiper {
  width: 100%;
  /* Viewport-aware: cap by the modal chrome on small screens (dvh). */
  height: min(70vh, calc(100dvh - 10rem));
}

/* Official coverflow sampling: auto-width slides capped below the
   stage width so the side slides stay partially visible (and clickable
   via slideToClickedSlide). */
.picture-viewer-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 72%;
}

/* Mobile (`mobile` breakpoint): the slides take the full stage width, so
   with `centeredSlides` + `slidesPerView: "auto"` both neighbours sit
   exactly one slide width away — fully outside the `overflow: hidden`
   stage.  The picture is thereby enlarged to the stage width or height
   and the side-slide click affordance disappears (drag and the arrow
   keys remain).  CSS-only: the Swiper config, its `:key` remount and the
   coverflow effect stay untouched. */
@media (max-width: 768px) {
  .picture-viewer-slide {
    max-width: 100%;
  }
}

/* Side slides are dimmed; hovering one raises it (click-to-switch
   affordance — slide-level pointer overrides the swiper's grab).
   NOTE: property LIST only (never a shorthand) — a shorthand would
   override swiper.css `.swiper-slide { transition-property: transform }`
   and kill the coverflow transform transition.  Duration stays
   inline-driven by Swiper (600ms during transitions). */
.picture-viewer-stage :deep(.picture-viewer-swiper .swiper-slide) {
  transition-property: transform, opacity;
  /* Explicit per-slide cursor: grab ONLY on the active slide; side
     slides get pointer (click-to-switch affordance). Overrides any
     cursor inherited from the wrapper (Swiper's grabCursor sets inline
     `cursor: grab` there). */
  cursor: auto;
}

.picture-viewer-stage
  :deep(.picture-viewer-swiper .swiper-slide:not(.swiper-slide-active)) {
  opacity: 0.5;
  cursor: pointer;
}

.picture-viewer-stage :deep(.picture-viewer-swiper .swiper-slide-active) {
  cursor: grab;
}

.picture-viewer-stage
  :deep(.picture-viewer-swiper .swiper-slide:not(.swiper-slide-active):hover) {
  opacity: 0.75;
}

/* NOTE: prefix with `.picture-viewer-stage` (scoped) — the `Swiper`
   component root does NOT carry the scope id, so
   `.picture-viewer-swiper :deep(...)` never matches. */
/* `.picture-viewer-img` lands on the <img> itself: the `class` prop is a
   declared prop, so the component applies it to the img and never to the
   overlay wrapper (which is matched by its own class name below). */
.picture-viewer-stage :deep(.picture-viewer-img) {
  max-width: 100%;
  object-fit: contain;
}

/* Swiper branch: the image, its optional overlay wrapper and the
   <picture> element all follow the slide box (height 100%; the img's
   percentage max-height then resolves against the picture) —
   `object-fit: contain` + the caps keep every aspect ratio fully
   visible inside the (72%-wide) slide — no clipping needs JS. */
.picture-viewer-stage :deep(.picture-viewer-swiper .feature-aware-picture),
.picture-viewer-stage :deep(.picture-viewer-swiper picture),
.picture-viewer-stage :deep(.picture-viewer-swiper picture img) {
  height: 100%;
  max-height: 100%;
}

/* Fallback branch: the slide wrap has no definite height — keep the
   viewport-based cap there (vh only, no dvh on old browsers). */
.picture-viewer-stage :deep(.picture-slide-wrap img) {
  max-height: min(70vh, calc(100vh - 10rem));
}

/* --- Fallback arrows (flank the stage, old browsers) --- */
.picture-viewer-fallback-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: var(--shlh-z-on-image);
  padding: 0.4rem 0.5rem;
  /* Neutral theme tint while luminance is unknown; the shared
     on-image palette overrides once sampled (per side). */
  background: var(--shlh-on-image-bar-bg, rgba(var(--bs-body-color-rgb), 0.15));
  color: var(--shlh-on-image-control-color, var(--bs-body-color));
  border-radius: 50%;
}

.picture-viewer-fallback-arrow-left {
  left: 0.5rem;
}

.picture-viewer-fallback-arrow-right {
  right: 0.5rem;
}

/* --- Picture-switch slide transition (symmetric mirror flow) --- */

/* Wrapper: keeps the transformed element block-level (transforms do not
   apply to inline elements like <picture>) and caps its width. */
.picture-slide-wrap {
  display: flex;
  justify-content: center;
  max-width: 100%;
}

.picture-slide-enter-active,
.picture-slide-leave-active {
  transition:
    opacity 0.3s ease-in-out,
    transform 0.3s ease-in-out;
}

/* next: old exits left, new enters from the mirrored (right) side */
.picture-slide-enter-from-next,
.picture-slide-leave-to-prev {
  opacity: 0;
  transform: translateX(25%) rotateY(15deg) scale(0.75);
}

.picture-slide-leave-to-next,
.picture-slide-enter-from-prev {
  opacity: 0;
  transform: translateX(-25%) rotateY(-15deg) scale(0.75);
}

/* --- Fraction indicator (current / total) --- */
.picture-viewer-fraction {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--shlh-z-on-image);
  padding: 0.125rem 0.625rem;
  /* Neutral theme tint while the luminance is unknown; the shared
     on-image palette overrides once sampled (bottom edge). */
  background: var(--shlh-on-image-bar-bg, rgba(var(--bs-body-color-rgb), 0.15));
  backdrop-filter: blur(var(--shlh-blur-sm));
  color: var(--shlh-on-image-control-color, var(--bs-body-color));
  border-radius: var(--bs-border-radius);
  font-size: 0.8rem;
  line-height: 1.25;
  pointer-events: none;
  user-select: none;
}

/* --- Navigation hints (modality-aware, self-fading) --- */
/* Only one variant shows at a time: swipe / drag for the pointer and
   touch modalities (Swiper also drags with a mouse), arrow keys for the
   keyboard modality.  The fade animation lives on the VARIANT, so a
   variant that starts as `display: none` begins fading the moment it
   appears; the container is re-created on every open (`:key="visible"`)
   to replay it — no JS timer anywhere. */
.picture-viewer-hints {
  position: absolute;
  bottom: 2.25rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--shlh-z-on-image);
  display: flex;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.picture-viewer-hint {
  display: none;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.625rem;
  /* Neutral theme tint while the luminance is unknown; the shared
     on-image palette overrides once sampled (bottom edge). */
  background: var(--shlh-on-image-bar-bg, rgba(var(--bs-body-color-rgb), 0.15));
  color: var(--shlh-on-image-control-color, var(--bs-body-color));
  border-radius: var(--bs-border-radius);
  font-size: 0.8rem;
  line-height: 1.25;
  backdrop-filter: blur(var(--shlh-blur-sm));
  animation: picture-hint-fade 5s ease forwards;
}

/* Default (pointer input, including "no input yet"): swipe or drag. */
.picture-viewer-hint-swipe {
  display: inline-flex;
}

/* Keyboard modality: the arrow-key hint replaces the swipe hint. */
html.user-input-keyboard .picture-viewer-hint-swipe {
  display: none;
}

html.user-input-keyboard .picture-viewer-hint-keys {
  display: inline-flex;
}

/* Fallback branch (no Swiper): the arrow-key hint has no drag / swipe
   counterpart, so it shows regardless of the modality. */
.picture-viewer-hints--fallback .picture-viewer-hint-keys {
  display: inline-flex;
}

@keyframes picture-hint-fade {
  0%,
  70% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}
</style>
