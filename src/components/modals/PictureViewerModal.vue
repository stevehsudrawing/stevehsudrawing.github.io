<!--
  PictureViewerModal.vue — single-image lightbox (stack id `picture-viewer`).

  Opened through openPictureViewerModal() — by the FeatureAwarePicture
  preview overlay, by the group viewer's `zoom_in` button (stacked on
  top of the group), or by a `?picId=` deep link.  The viewer reads no
  query parameters and writes no history of its own; leaving the page
  closes it.

  Chrome: the picture title, a footer with the zoom controls
  (`remove` / slider / `add`) and the related-link button plus Close,
  and the ALT description button on the image.  No QR share button (a
  share target belongs to the URL-owning group viewer), no Back button
  (synonymous with Close) and no preview button (no recursion).
  Preview-only: `.no-copy`.

  Zoom & pan: `@panzoom/panzoom` drives the stage — wheel zoom at the
  cursor (a thin rAF layer eases the scale; panzoom ships no wheel
  smoothing), drag pan, animated arrow-key pan, `+` / `-` / `0`
  keyboard zoom, double-click toggle and touch pinch.  The panzoom
  element is the stage-stretched box, so `contain: "outside"` reads a
  cover ratio of exactly 1 — the scale runs free in [1, 4] and the pan
  clamp keeps the box covering the stage at every scale.  A
  modality-aware hint line explains the gestures and fades on its own.
-->
<script setup lang="ts">
import type { PanzoomObject } from "@panzoom/panzoom";
import Panzoom from "@panzoom/panzoom";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { setSwipeTrackingEnabled } from "../../composables/core/useGesture";
import { useI18n } from "../../composables/core/useI18n";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { isImageEdgeDark } from "../../platform/image-luminance";
import type { FeatureAwarePictureProps } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import TruncatedTitle from "../ui/TruncatedTitle.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("picture-viewer");
const { pop, clear } = useModalStack();
const { t } = useI18n();
const router = useRouter();

/**
 * Chrome title — the picture's own title, or the localized default when
 * none was passed (an empty string falls back too: `||`, never `??`).
 */
const title = computed(
  () => stackProps.value?.img.title || t("text-image-preview"),
);

/** Related link of the picture (footer button — hidden when absent). */
const relatedLink = computed(() => stackProps.value?.img.relatedLink ?? null);

/**
 * Stage display props: the caller's image props with the stage-owned keys
 * stripped (`class` is replaced, `aspectRatio` / `width` / `height` may
 * not compete with the stage sizing), the ALT button forced on when an
 * alt text exists and the preview button forced off.
 */
const imageProps = computed<FeatureAwarePictureProps | null>(() => {
  const img = stackProps.value?.img;
  if (!img) return null;
  const {
    class: _class,
    aspectRatio: _aspectRatio,
    width: _width,
    height: _height,
    ...rest
  } = img;
  return {
    ...rest,
    class: "picture-single-img no-copy",
    showAltButton: !!img.alt,
    previewable: false,
  };
});

// -------------------------------------------------------------------------
// Zoom & pan (panzoom)
// -------------------------------------------------------------------------

/** Stage element — the wheel surface and panzoom's containment parent. */
const stageRef = ref<HTMLElement | null>(null);

/** Pan-zoom box — the drag surface and the panzoom element. */
const panRef = ref<HTMLElement | null>(null);

/** Live panzoom instance (built per stage mount, on show). */
let panzoom: PanzoomObject | null = null;

/** Element the live instance is bound to (DOM identity guard). */
let panzoomElement: HTMLElement | null = null;

/** A fresh props push awaits its open-time transform reset. */
let pendingReset = false;

/** Whether the stage currently shows the zoomed state (> 1×). */
const zoomed = ref(false);

/** Whether the pointer is dragging the picture (grab → grabbing). */
const dragging = ref(false);

/** Bottom-edge luminance of the current source (hints palette). */
const bottomDark = ref<boolean | null>(null);

/** Zoom-in ceiling (panzoom's default is the same value). */
const MAX_SCALE = 4;

/** Arrow-key pan step per press, in CSS pixels. */
const PAN_STEP_PX = 40;

/** Arrow-key pan duration (ms) — the official animated pan. */
const PAN_DURATION_MS = 120;

/** Double-click / double-tap target scale. */
const DOUBLE_CLICK_SCALE = 2;

/** Wheel factor per 100 px of normalized delta (≈ panzoom's e^0.1). */
const WHEEL_SCALE_STEP = 0.1;

/** Per-frame easing factor of the wheel loop (≈ 200 ms settle). */
const WHEEL_EASE_ALPHA = 0.3;

/** Scale delta at which the wheel loop settles. */
const WHEEL_SETTLE_EPSILON = 0.002;

/** Largest per-event wheel delta, in normalized 100 px units. */
const WHEEL_DELTA_CAP = 2;

/** Current scale — mirrors panzoom for the slider and button states. */
const scaleValue = ref(1);

/** Wheel smoothing: target scale (null = loop idle). */
let wheelTarget: number | null = null;

/** Wheel smoothing: focal point of the latest wheel event. */
let wheelFocal = { clientX: 0, clientY: 0 };

/** Wheel smoothing: pending rAF handle (0 = none). */
let wheelRaf = 0;

/**
 * Whether zoom transitions must not animate — the system's
 * reduced-motion preference or the manual `no-animations` toggle.
 */
function prefersNoAnimation(): boolean {
  return (
    document.documentElement.classList.contains("no-animations") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Mirror the current scale into the stage class and the slider. */
function applyZoomedState(): void {
  const scale = panzoom?.getScale() ?? 1;
  zoomed.value = scale > 1.001;
  scaleValue.value = scale;
}

/** Keep the state in sync while panzoom animates / clamps on its own. */
function onPanzoomChange(): void {
  applyZoomedState();
}

/** Track the drag only while zoomed (at 1× the pan is locked). */
function onPanzoomStart(): void {
  cancelWheelSmoothing();
  dragging.value = (panzoom?.getScale() ?? 1) > 1.001;
}

function onPanzoomEnd(): void {
  dragging.value = false;
}

/**
 * Build (or rebuild) the panzoom instance for the current stage DOM.
 * Idempotent — the element identity guard catches re-shows.
 */
function ensurePanzoom(): void {
  const stage = stageRef.value;
  const box = panRef.value;
  if (!stage || !box || (panzoom && panzoomElement === box)) return;
  destroyPanzoom();

  panzoom = Panzoom(box, {
    minScale: 1,
    maxScale: MAX_SCALE,
    // The box is stretched to the stage on both axes, so the
    // cover ratio reads as exactly 1: "outside" never force-clamps the
    // scale, and the pan clamp keeps the box covering the stage at
    // every scale — no empty space beyond the box, ever.  ("inside"
    // would cap the scale at the fit ratio whenever the element is
    // smaller than the stage.)
    contain: "outside",
    panOnlyWhenZoomed: true,
    // `inherit` follows the stage's shared `.drag-cursor` pair — the box is
    // the stage's direct child; panzoom only owns the resting style.
    cursor: "inherit",
  });
  panzoomElement = box;

  box.addEventListener("panzoomchange", onPanzoomChange);
  box.addEventListener("panzoomstart", onPanzoomStart);
  box.addEventListener("panzoomend", onPanzoomEnd);
  stage.addEventListener("wheel", onWheel, { passive: false });
  stage.addEventListener("dblclick", onDblClick);
}

/** Tear down the instance and every extra listener. */
function destroyPanzoom(): void {
  cancelWheelSmoothing();
  panzoom?.destroy();
  panzoom = null;
  zoomed.value = false;
  dragging.value = false;
  stageRef.value?.removeEventListener("wheel", onWheel);
  stageRef.value?.removeEventListener("dblclick", onDblClick);
  panzoomElement?.removeEventListener("panzoomchange", onPanzoomChange);
  panzoomElement?.removeEventListener("panzoomstart", onPanzoomStart);
  panzoomElement?.removeEventListener("panzoomend", onPanzoomEnd);
  panzoomElement = null;
}

/**
 * Normalize a wheel event to 100 px units (a mouse notch ≈ 1), honouring
 * deltaMode (line / page) and the shift-horizontal convention.
 *
 * @param event - The wheel event.
 * @returns Normalized delta (positive = zoom out).
 */
function normalizeWheelDelta(event: WheelEvent): number {
  const raw = event.deltaY === 0 && event.deltaX ? event.deltaX : event.deltaY;
  const unit = event.deltaMode === 1 ? 33 : event.deltaMode === 2 ? 400 : 1;
  return (raw * unit) / 100;
}

/** Cancel a running wheel-smoothing loop (every interruption point). */
function cancelWheelSmoothing(): void {
  if (wheelRaf !== 0) {
    cancelAnimationFrame(wheelRaf);
    wheelRaf = 0;
  }
  wheelTarget = null;
}

/** One easing frame of the wheel-smoothing loop. */
function stepWheelSmoothing(): void {
  wheelRaf = 0;
  if (!panzoom || wheelTarget === null) return;
  const current = panzoom.getScale();
  const next = current + (wheelTarget - current) * WHEEL_EASE_ALPHA;
  const settled = Math.abs(wheelTarget - next) < WHEEL_SETTLE_EPSILON;
  panzoom.zoomToPoint(settled ? wheelTarget : next, wheelFocal);
  applyZoomedState();
  if (settled) wheelTarget = null;
  else wheelRaf = requestAnimationFrame(stepWheelSmoothing);
}

/**
 * Wheel over the stage: zoom at the cursor.  panzoom ships no wheel
 * smoothing (`zoomWithWheel` hard-codes `animate: false`), so a thin
 * rAF layer eases the scale toward a clamped target; reduced motion
 * applies the target directly.
 */
function onWheel(event: WheelEvent): void {
  if (!panzoom) return;
  event.preventDefault();
  const delta = normalizeWheelDelta(event);
  if (delta === 0) return;
  const capped = Math.max(-WHEEL_DELTA_CAP, Math.min(WHEEL_DELTA_CAP, delta));
  const from = wheelTarget ?? panzoom.getScale();
  // Sign follows panzoom: a negative delta (scroll up) zooms IN.
  const target = Math.min(
    MAX_SCALE,
    Math.max(1, from * Math.exp(-WHEEL_SCALE_STEP * capped)),
  );
  wheelFocal = { clientX: event.clientX, clientY: event.clientY };
  if (prefersNoAnimation()) {
    cancelWheelSmoothing();
    panzoom.zoomToPoint(target, wheelFocal);
    applyZoomedState();
    return;
  }
  wheelTarget = target;
  if (wheelRaf === 0) wheelRaf = requestAnimationFrame(stepWheelSmoothing);
}

/** Double-click / double-tap: toggle 1× ⇄ 2× at the pointer. */
function onDblClick(event: MouseEvent): void {
  if (!panzoom) return;
  // The corner controls sit inside the box — never toggle from them.
  const target = event.target as Element | null;
  if (target?.closest(".picture-overlay-controls")) return;
  cancelWheelSmoothing();
  if (panzoom.getScale() > 1.001) {
    resetView(true);
    return;
  }
  panzoom.zoomToPoint(DOUBLE_CLICK_SCALE, {
    clientX: event.clientX,
    clientY: event.clientY,
  });
  applyZoomedState();
}

/**
 * Reset to the fit view (1×, centred).
 *
 * @param animate - Whether the transition may animate (never under
 *   reduced motion).
 */
function resetView(animate: boolean): void {
  if (!panzoom) return;
  cancelWheelSmoothing();
  panzoom.reset({ animate: animate && !prefersNoAnimation() });
  applyZoomedState();
}

/**
 * Keyboard / button zoom step (`+` / `-`), animated unless reduced
 * motion is on.
 *
 * @param direction - 1 = zoom in, -1 = zoom out.
 */
function zoomStep(direction: 1 | -1): void {
  if (!panzoom) return;
  cancelWheelSmoothing();
  const options = { animate: !prefersNoAnimation() };
  if (direction === 1) panzoom.zoomIn(options);
  else panzoom.zoomOut(options);
  applyZoomedState();
}

/**
 * Zoom-slider input — apply the requested scale about the stage centre.
 *
 * @param value - The range value (`update:modelValue`; a string unless
 *   a `.number` modifier was used; `null` is ignored).
 */
function onRangeUpdate(value: string | number | null): void {
  if (!panzoom || value === null) return;
  cancelWheelSmoothing();
  const scale = Math.min(MAX_SCALE, Math.max(1, Number(value)));
  const stage = stageRef.value;
  if (!stage) return;
  const rect = stage.getBoundingClientRect();
  panzoom.zoomToPoint(scale, {
    clientX: rect.left + rect.width / 2,
    clientY: rect.top + rect.height / 2,
  });
  applyZoomedState();
}

/**
 * Window-level keydown (capture phase, bound while shown).  The viewer
 * is the TOP modal while open, so its keys are consumed here BEFORE they
 * can reach the group viewer's Swiper underneath; handled keys always
 * `preventDefault` + `stopPropagation`, pan / zoom active or not.
 *
 * Arrow direction: the VIEWPORT moves toward the pressed
 * arrow (ArrowLeft translates the picture right, and vice versa).
 */
function onKeydown(event: KeyboardEvent): void {
  if (!panzoom || event.ctrlKey || event.metaKey || event.altKey) return;
  const { key, code } = event;

  // A focused slider owns its arrow keys (native range adjustment);
  // only the propagation is stopped — `stopPropagation` never cancels
  // the default action, so the slider still moves — and the covered
  // Swiper underneath stays shielded.
  const target = event.target as HTMLElement | null;
  if (
    target instanceof HTMLInputElement &&
    target.type === "range" &&
    key.startsWith("Arrow")
  ) {
    event.stopPropagation();
    return;
  }

  if (
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown"
  ) {
    if (panzoom.getScale() > 1.001) {
      cancelWheelSmoothing();
      const toX =
        key === "ArrowLeft"
          ? PAN_STEP_PX
          : key === "ArrowRight"
            ? -PAN_STEP_PX
            : 0;
      const toY =
        key === "ArrowUp"
          ? PAN_STEP_PX
          : key === "ArrowDown"
            ? -PAN_STEP_PX
            : 0;
      panzoom.pan(toX, toY, {
        relative: true,
        animate: !prefersNoAnimation(),
        duration: PAN_DURATION_MS,
      });
    }
  } else if (key === "+" || key === "=" || code === "NumpadAdd") {
    zoomStep(1);
  } else if (key === "-" || key === "_" || code === "NumpadSubtract") {
    zoomStep(-1);
  } else if (key === "0" || code === "Numpad0") {
    resetView(true);
  } else {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
}

/**
 * Sample the bottom edge of the current source — the hint pill sits on
 * the picture's bottom edge.  Driven by the image's `load` event, so
 * fresh loads and theme / language swaps both re-sample.
 */
function sampleBottomLuminance(): void {
  const img = panRef.value?.querySelector("img");
  const src = img?.currentSrc || img?.src;
  if (!src) return;
  void isImageEdgeDark(src, { edge: "bottom", ratio: 0.1 }).then((dark) => {
    bottomDark.value = dark;
  });
}

/**
 * Write the measured stage height into the image-cap CSS variable
 * (`--shlh-picture-stage-h`) — the wrapper stays picture-sized (the ALT
 * anchor), so percentage height chains cannot cap the img; the measured
 * value replaces the viewport-based fallback.
 */
function syncStageHeightVar(): void {
  const stage = stageRef.value;
  if (!stage) return;
  const height = stage.clientHeight;
  if (height > 0) {
    stage.style.setProperty("--shlh-picture-stage-h", `${height}px`);
  }
}

// A fresh push adopts new props — the next show resets the transform
// (a rapid close-then-reopen may reuse the stage DOM with the old zoom).
watch(stackProps, (props) => {
  if (!props) return;
  pendingReset = true;
  bottomDark.value = null;
});

// The stage unmounts when the props retire (300 ms after Close): tear
// the instance down with it; the next open builds a fresh one.
watch(imageProps, (value) => {
  if (!value) {
    destroyPanzoom();
    return;
  }
  // A picture swap while open (defensive — today every open goes
  // through onShown).
  void nextTick(() => {
    ensurePanzoom();
    applyZoomedState();
  });
});

// =========================================================================
// Actions
// =========================================================================

/** Close the lightbox — stay on the current page, keep the history intact. */
function close(): void {
  pop();
}

/**
 * Related-link click — only INTERNAL links dismiss the overlay: the
 * picture is about to be replaced by its destination page, so the whole
 * stack is cleared and the navigation is pushed on the next tick (the
 * close bookkeeping runs in the same flush and would otherwise cancel a
 * synchronous push).
 *
 * Every other type keeps the stack intact: `TypeAwareLink`'s own handler
 * (which runs first) pushes the confirmation modal for external links —
 * clearing here would remove the modal it had just pushed — and handles
 * email / anchor links natively.  The lightbox stays underneath as the
 * user's context; the confirmation dismisses itself (`pop()`), and only
 * Esc / backdrop clear the whole stack.
 */
function onRelatedLinkClick(): void {
  const link = relatedLink.value;
  if (!link || link.type !== "internal") return;
  clear();
  nextTick(() => router.push(link.href));
}

function onShown(): void {
  // Fullscreen lightbox: suppress offcanvas edge-swipes while open.
  setSwipeTrackingEnabled(false);
  // Capture-phase listener — see onKeydown().
  window.addEventListener("keydown", onKeydown, true);
  window.addEventListener("resize", syncStageHeightVar);
  void nextTick(() => {
    ensurePanzoom();
    if (pendingReset) {
      pendingReset = false;
      resetView(false);
    }
    applyZoomedState();
    syncStageHeightVar();
  });
}

function onHidden(): void {
  setSwipeTrackingEnabled(true);
  window.removeEventListener("keydown", onKeydown, true);
  window.removeEventListener("resize", syncStageHeightVar);
  cancelWheelSmoothing();
}

onBeforeUnmount(() => {
  setSwipeTrackingEnabled(true);
  window.removeEventListener("keydown", onKeydown, true);
  window.removeEventListener("resize", syncStageHeightVar);
  cancelWheelSmoothing();
  destroyPanzoom();
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="title"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    dialog-class="full-bleed-dialog"
    @shown="onShown"
    @hidden="onHidden"
  >
    <template #title>
      <TruncatedTitle :text="title" />
    </template>
    <!-- ==== Single-image stage (pan / zoom) ==== -->
    <div
      ref="stageRef"
      class="picture-single-stage drag-cursor"
      :class="{
        'picture-single-stage--zoomed': zoomed,
        'is-dragging': dragging,
      }"
    >
      <div v-if="imageProps" ref="panRef" class="picture-single-pan">
        <FeatureAwarePicture
          v-bind="imageProps"
          @load="sampleBottomLuminance"
        />
      </div>

      <!-- ==== Zoom hints (modality-aware, self-fading) ==== -->
      <div
        v-if="imageProps"
        :key="visible ? 'open' : 'closed'"
        class="picture-single-hints"
        :class="
          bottomDark === true
            ? 'toast-on-image-dark'
            : bottomDark === false
              ? 'toast-on-image-light'
              : ''
        "
        aria-hidden="true"
      >
        <span class="picture-single-hint picture-single-hint-mouse">
          <MaterialSymbol name="zoom_in" />
          {{ t("text-zoom-hints-mouse") }}
        </span>
        <span class="picture-single-hint picture-single-hint-touch">
          <MaterialSymbol name="zoom_in" />
          {{ t("text-zoom-hints-touch") }}
        </span>
        <span class="picture-single-hint picture-single-hint-keys">
          <MaterialSymbol name="swap_horiz" />
          {{ t("text-zoom-hints-keyboard") }}
        </span>
      </div>
    </div>

    <template #footer>
      <div class="w-100 d-flex align-items-center">
        <!-- Zoom controls (left): step buttons flank the slider. -->
        <div
          class="picture-single-zoom-cluster d-flex align-items-center flex-grow-1 me-2"
        >
          <TooltipTrigger :title="t('text-zoom-out')">
            <button
              type="button"
              class="btn btn-same-padding btn-outline-primary btn-no-border"
              :disabled="scaleValue <= 1"
              :aria-label="$t('text-zoom-out')"
              @click="zoomStep(-1)"
            >
              <MaterialSymbol name="remove" />
            </button>
          </TooltipTrigger>
          <BFormInput
            type="range"
            class="picture-single-zoom-range"
            min="1"
            :max="MAX_SCALE"
            step="0.01"
            :model-value="scaleValue"
            :aria-label="$t('text-zoom-level')"
            @update:model-value="onRangeUpdate"
          />
          <TooltipTrigger :title="t('text-zoom-in')">
            <button
              type="button"
              class="btn btn-same-padding btn-outline-primary btn-no-border"
              :disabled="scaleValue >= MAX_SCALE"
              :aria-label="$t('text-zoom-in')"
              @click="zoomStep(1)"
            >
              <MaterialSymbol name="add" />
            </button>
          </TooltipTrigger>
        </div>
        <div class="d-flex align-items-center">
          <TooltipTrigger :title="t('text-open-related-page')">
            <TypeAwareLink
              v-if="relatedLink"
              v-bind="relatedLink"
              class="btn btn-same-padding btn-outline-primary btn-no-border"
              :aria-label="$t('text-open-related-page')"
              @click="onRelatedLinkClick()"
              hide-indicator
              no-underline
            >
              <MaterialSymbol name="open_in_new" />
            </TypeAwareLink>
          </TooltipTrigger>
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border ms-2"
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
/* --- Pan / zoom stage --- */
/* The stage takes the remaining body height (`flex: 1`) and STRETCHES
   the pan box — box height == stage height, no percentage chain. */
.picture-single-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

/* Panzoom element: stretched to the stage on both axes, so panzoom's
   `contain: "outside"` reads a cover ratio of exactly 1 and never
   force-clamps the scale.  The box is the drag surface; the wrapper it
   centres keeps the picture-sized anchor for the corner controls. */
.picture-single-pan {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The stage owns the shared `.drag-cursor` pair (plus `is-dragging`); the
   panzoom element inherits it through its inline `cursor: inherit`. */

/* The picture never exceeds the stage.  NOTE: the `class` prop lands on
   the <img> (a declared prop never falls through to the root element),
   so the overlay wrapper is matched by its own class name and the img by
   an element selector — a `.picture-single-img img` rule would never
   match anything. */
.picture-single-pan :deep(.feature-aware-picture),
.picture-single-pan :deep(picture) {
  max-width: 100%;
}

/* The img caps against the MEASURED stage height (`syncStageHeightVar`)
   — the wrapper stays picture-sized (the ALT anchor), so a percentage
   chain cannot reach it.  The viewport formula is the first-frame /
   no-JS fallback; `dvh` gets its own declaration so an unsupported unit
   cannot drop the whole rule. */
.picture-single-pan :deep(img) {
  max-width: 100%;
  max-height: calc(100vh - 10rem);
  max-height: var(--shlh-picture-stage-h, calc(100dvh - 10rem));
  object-fit: contain;
}

/* --- Zoomed overlay policy --- */
/* While scale > 1 the corner controls give way to the gesture: the
   controls layer fades (and fades back on reset — the transition lives
   here on the base state), and `visibility: hidden` makes the subtree
   non-interactive instantly (it beats any pointer-events the button
   reveal rules would set).  The wrapper loses its pointer events too,
   which disables the hover reveal itself rather than fighting the
   button-level rule; panzoom's drag surface is the box below, so the
   gesture keeps working. */
.picture-single-pan :deep(.picture-overlay-controls) {
  transition: opacity var(--shlh-duration-fast) ease;
}

.picture-single-stage--zoomed :deep(.picture-overlay-controls) {
  opacity: 0;
  visibility: hidden;
}

.picture-single-stage--zoomed :deep(.feature-aware-picture) {
  pointer-events: none;
}

/* --- Zoom hints (modality-aware, self-fading) --- */
/* Only one variant shows at a time: pointer / touch / keyboard.  The
   fade animation lives on the VARIANT; the container is re-created on
   every open (`:key="visible"`) so the animation replays — no JS timer
   anywhere. */
.picture-single-hints {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: var(--shlh-z-on-image);
  display: flex;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.picture-single-hint {
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

/* Default (pointer input, including "no input yet"): wheel / drag. */
.picture-single-hint-mouse {
  display: inline-flex;
}

/* Touch modality: pinch / drag / double-tap. */
html.user-input-touch .picture-single-hint-mouse {
  display: none;
}

html.user-input-touch .picture-single-hint-touch {
  display: inline-flex;
}

/* Keyboard modality: +/- and the arrow keys. */
html.user-input-keyboard .picture-single-hint-mouse {
  display: none;
}

html.user-input-keyboard .picture-single-hint-keys {
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

/* --- Zoom controls (footer) --- */
/* The cluster shrinks (`min-width: 0`) and the slider flexes from a
   zero basis, so the footer keeps its right-side buttons at narrow
   widths; the left cluster grows at wide ones. */
.picture-single-zoom-cluster {
  min-width: 0;
}

.picture-single-zoom-range {
  width: auto;
  flex: 1 1 0px;
  min-width: 0;
  max-width: 10rem;
  margin: 0 0.375rem;
}
</style>
