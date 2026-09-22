<!--
  PictureViewerModal.vue — single-image lightbox (stack id `picture-viewer`).

  Opened through openPictureViewerModal() (composables/modals/usePictureViewerModal.ts) by
  the FeatureAwarePicture overlay preview button, by the group viewer's
  `zoom_in` footer button (v3.20.1 — pushed ON TOP of the group; Close
  reveals it again) — or by any other caller that wants to show one
  picture enlarged.

  Deliberately independent of the Swiper stage and of the URL wiring: it
  reads no query parameters and creates no history entry of its own
  (`?picId=` / `?picGroupId=` belong to the URL owner and the GROUP viewer,
  which mirrors the entry param back to the URL).  Leaving the page closes
  it (App.vue).

  Chrome: the standard BModal shell — the picture title, an optional
  centered message under the stage, and a footer with the related-link
  button (when the picture carries one) plus Close.  Deliberately no QR
  share button (a share target is a URL, and `TypeAwareLink` /
  `ExternalLinkConfirmModal` own that decision) and no Back button (Back
  would be synonymous with Close here).  The image keeps the ALT button
  (title + description popover) but never a preview button (no
  recursion).  Preview-only: `.no-copy`.

  Zoom & pan (v3.20.1): `@panzoom/panzoom` drives the stage — wheel zoom
  at the cursor, drag pan (grab / grabbing), arrow-key pan, `+` / `-` /
  `0` keyboard zoom, double-click toggle and touch pinch.  The panzoom
  element is the stage-sized box whose parent is the stage, so
  `contain: "outside"` reads a cover ratio of exactly 1 — the scale runs
  free in [1, 4] and the pan clamp keeps the box covering the stage at
  every scale.  The corner ALT control fades out while zoomed; a
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

/** Optional message rendered under the stage. */
const message = computed(() => stackProps.value?.img.message ?? "");

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
// Zoom & pan (panzoom — v3.20.1)
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

/** Double-click / double-tap target scale. */
const DOUBLE_CLICK_SCALE = 2;

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

/** Mirror the current scale into the `--zoomed` stage class. */
function applyZoomedState(): void {
  zoomed.value = (panzoom?.getScale() ?? 1) > 1.001;
}

/** Keep the state in sync while panzoom animates / clamps on its own. */
function onPanzoomChange(): void {
  applyZoomedState();
}

/** Track the drag only while zoomed (at 1× the pan is locked). */
function onPanzoomStart(): void {
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
    // The box fills the stage on both axes (its auto height is the
    // picture height — floored at 50vh — and the stage follows it, no
    // other content), so the cover ratio reads as exactly 1: "outside"
    // never force-clamps the scale, and the pan clamp keeps the box
    // covering the stage at every scale — no empty space beyond the
    // box, ever.  ("inside" would cap the scale at the fit ratio
    // whenever the element is smaller than the stage.)
    contain: "outside",
    panOnlyWhenZoomed: true,
    cursor: "grab",
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

/** Wheel over the stage zooms at the cursor (panzoom owns the math). */
function onWheel(event: WheelEvent): void {
  panzoom?.zoomWithWheel(event);
}

/** Double-click / double-tap: toggle 1× ⇄ 2× at the pointer. */
function onDblClick(event: MouseEvent): void {
  if (!panzoom) return;
  // The corner controls sit inside the box — never toggle from them.
  const target = event.target as Element | null;
  if (target?.closest(".picture-overlay-controls")) return;
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
  panzoom.reset({ animate: animate && !prefersNoAnimation() });
  applyZoomedState();
}

/**
 * Keyboard zoom step (`+` / `-`), animated unless reduced motion is on.
 *
 * @param direction - 1 = zoom in, -1 = zoom out.
 */
function zoomStep(direction: 1 | -1): void {
  if (!panzoom) return;
  const options = { animate: !prefersNoAnimation() };
  if (direction === 1) panzoom.zoomIn(options);
  else panzoom.zoomOut(options);
  applyZoomedState();
}

/**
 * Window-level keydown (capture phase, bound while shown).  The viewer
 * is the TOP modal while open, so its keys are consumed here BEFORE they
 * can reach the group viewer's Swiper underneath; handled keys always
 * `preventDefault` + `stopPropagation`, pan / zoom active or not.
 */
function onKeydown(event: KeyboardEvent): void {
  if (!panzoom || event.ctrlKey || event.metaKey || event.altKey) return;
  const { key, code } = event;

  if (
    key === "ArrowLeft" ||
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown"
  ) {
    if (panzoom.getScale() > 1.001) {
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
      panzoom.pan(toX, toY, { relative: true, animate: false });
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
  void nextTick(() => {
    ensurePanzoom();
    if (pendingReset) {
      pendingReset = false;
      resetView(false);
    }
    applyZoomedState();
  });
}

function onHidden(): void {
  setSwipeTrackingEnabled(true);
  window.removeEventListener("keydown", onKeydown, true);
}

onBeforeUnmount(() => {
  setSwipeTrackingEnabled(true);
  window.removeEventListener("keydown", onKeydown, true);
  destroyPanzoom();
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
    <!-- ==== Single-image stage (pan / zoom) ==== -->
    <div
      ref="stageRef"
      class="picture-single-stage"
      :class="{ 'picture-single-stage--zoomed': zoomed }"
    >
      <div
        v-if="imageProps"
        ref="panRef"
        class="picture-single-pan"
        :class="{ 'picture-single-pan--dragging': dragging }"
      >
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

    <!-- ==== Optional message (centered under the picture) ==== -->
    <p v-if="message" class="picture-single-message">{{ message }}</p>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-open-related-page')">
          <TypeAwareLink
            v-if="relatedLink"
            v-bind="relatedLink"
            class="btn btn-same-padding btn-outline-primary btn-no-border me-auto"
            :aria-label="$t('text-open-related-page')"
            @click="onRelatedLinkClick()"
            hide-indicator
            no-underline
          >
            <MaterialSymbol name="open_in_new" />
          </TypeAwareLink>
        </TooltipTrigger>
        <div class="ms-auto">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border ms-auto"
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
.picture-single-stage {
  position: relative;
  min-height: 50vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Panzoom element: fills the stage on the width, and its auto height
   (= the picture height, floored at 50vh) IS the stage height — the
   stage follows this box (no other content), so panzoom's `contain:
   "outside"` reads a cover ratio of exactly 1 and never force-clamps
   the scale.  The box is the drag surface; the wrapper it centres keeps
   the picture-sized anchor for the corner controls. */
.picture-single-pan {
  width: 100%;
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Drag feedback: panzoom sets the resting `cursor: grab` inline, so the
   dragging class needs `!important` to win over that inline style. */
.picture-single-pan--dragging {
  cursor: grabbing !important;
}

/* The picture never exceeds the stage.  NOTE: the `class` prop lands on
   the <img> (a declared prop never falls through to the root element),
   so the overlay wrapper is matched by its own class name and the img by
   an element selector — a `.picture-single-img img` rule would never
   match anything. */
.picture-single-pan :deep(.feature-aware-picture),
.picture-single-pan :deep(picture) {
  max-width: 100%;
}

/* The img fits the stage box: capped by the width AND by the available
   viewport height (the modal chrome + margins are deducted), so a large
   picture shrinks instead of producing a vertical scrollbar.  Two
   declarations on purpose: the `vh` one is the fallback for browsers
   without `dvh` support (an unsupported unit invalidates the whole
   declaration). */
.picture-single-pan :deep(img) {
  max-width: 100%;
  max-height: min(70vh, calc(100vh - 12rem));
  max-height: min(70vh, calc(100dvh - 12rem));
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

/* --- Optional message (under the picture) --- */
.picture-single-message {
  max-width: 32rem;
  margin: 0.75rem auto 0;
  text-align: center;
  color: var(--bs-secondary-color);
}
</style>
