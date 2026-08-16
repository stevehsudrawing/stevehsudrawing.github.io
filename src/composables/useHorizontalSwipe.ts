/**
 * Horizontal swipe composable — fires `onLeft` / `onRight` callbacks for
 * horizontal swipes over a target element (e.g. the lightbox image stage).
 *
 * Touch-only (touch events only fire on touch input).  Threshold-based,
 * mirroring `useGesture.ts`: a swipe counts only when the horizontal
 * displacement exceeds `SWIPE_THRESHOLD` AND is clearly horizontal
 * (`|dx| > |dy| * DIRECTION_RATIO`).  Only horizontal-dominant `touchmove`
 * events are `preventDefault`-ed, so vertical page scrolling is preserved.
 *
 * The listeners attach when `targetRef` becomes available (and detach on
 * unmount), so the composable works with lazily-rendered targets.
 *
 * @param targetRef - Ref to the element that receives the swipe gestures.
 * @param callbacks - `onLeft` (swipe left) and `onRight` (swipe right).
 *
 * @example
 * useHorizontalSwipe(stageRef, {
 *   onLeft: () => next(),
 *   onRight: () => prev(),
 * });
 */

import { onBeforeUnmount, watch, type Ref } from "vue";

// =========================================================================
// Constants
// =========================================================================

/** Minimum horizontal distance (px) to trigger a swipe. */
const SWIPE_THRESHOLD = 80;

/**
 * Direction ratio: horizontal displacement must exceed vertical displacement
 * multiplied by this factor to count as a horizontal swipe.
 */
const DIRECTION_RATIO = 1.5;

// =========================================================================
// Composable
// =========================================================================

/**
 * Attach horizontal-swipe detection to a target element.
 * @param targetRef - Ref to the swipe target element.
 * @param callbacks - Swipe handlers (`onLeft` / `onRight`).
 */
export function useHorizontalSwipe(
  targetRef: Ref<HTMLElement | null>,
  callbacks: { onLeft: () => void; onRight: () => void },
): void {
  let startX = 0;
  let startY = 0;
  let tracking = false;

  function onTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    tracking = true;
  }

  function onTouchMove(e: TouchEvent): void {
    if (!tracking) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    // Horizontal-dominant movement: block vertical scroll / page bounce.
    if (Math.abs(dx) > Math.abs(dy) * DIRECTION_RATIO && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }

  function onTouchEnd(e: TouchEvent): void {
    if (!tracking) return;
    tracking = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;

    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dx) <= Math.abs(dy) * DIRECTION_RATIO) return;

    if (dx > 0) callbacks.onRight();
    else callbacks.onLeft();
  }

  function attach(el: HTMLElement): void {
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
  }

  function detach(el: HTMLElement | null | undefined): void {
    if (!el) return;
    el.removeEventListener("touchstart", onTouchStart);
    el.removeEventListener("touchmove", onTouchMove);
    el.removeEventListener("touchend", onTouchEnd);
  }

  // Attach when the target appears, detach when it disappears / unmounts.
  watch(
    targetRef,
    (el, prev) => {
      detach(prev);
      if (el) attach(el);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => {
    detach(targetRef.value);
  });
}
