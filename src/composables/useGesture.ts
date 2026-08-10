/**
 * Gesture composable — edge-swipe gestures to open/close offcanvas.
 *
 * On mobile viewports (≤ 992 px) with touch input (`html.user-input-touch`):
 * - **Open**: rightward swipe from the left edge → sets `model.value = true`
 * - **Close**: leftward swipe from the right edge → sets `model.value = false`
 *
 * Uses a **module-level singleton** pattern: touch listeners are registered
 * once (on first consumer mount) and torn down when the last consumer
 * unmounts.  The gesture detection is threshold-based (not tracking) to
 * avoid conflicts with Bootstrap Offcanvas's own animation.
 *
 * @param model - A writable `Ref<boolean>` that the gesture will toggle:
 *   `false` → left-edge right-swipe sets it to `true`,
 *   `true`  → right-edge left-swipe sets it to `false`.
 *
 * @example
 * const showOffcanvas = ref(false);
 * useGesture(showOffcanvas);
 */

import { onMounted, onBeforeUnmount, type Ref } from "vue";
import { useBreakpoint } from "./useBreakpoint";

// =========================================================================
// Constants
// =========================================================================

/** Maximum distance (px) from either edge to start tracking a swipe. */
const EDGE_THRESHOLD = 80;

/** Minimum horizontal distance (px) to trigger the swipe action. */
const SWIPE_THRESHOLD = 80;

/**
 * Direction ratio: horizontal displacement must exceed vertical displacement
 * multiplied by this factor to prevent conflicts with vertical scrolling.
 */
const DIRECTION_RATIO = 1.5;

// =========================================================================
// Types
// =========================================================================

/** Which gesture direction is currently being tracked. */
type GestureDirection = "open" | "close";

// =========================================================================
// Module-level shared state (singleton)
// =========================================================================

/** Reference count for touch listeners — same pattern as useBreakpoint. */
let listenerCount = 0;

/** touchstart X coordinate of the current tracking session. */
let touchStartX = 0;

/** touchstart Y coordinate of the current tracking session. */
let touchStartY = 0;

/** Whether we are currently tracking a potential swipe gesture. */
let tracking = false;

/** Which direction the current tracking session is for ("open" or "close"). */
let trackingDirection: GestureDirection | null = null;

/** The model ref to toggle when a swipe is detected. */
let activeModel: Ref<boolean> | null = null;

/**
 * Shared breakpoint ref — captured on first call.
 * `useBreakpoint()` returns a module-level singleton, so all consumers
 * share the same reactive value.
 */
let breakpointRef: Ref<
  ReturnType<typeof useBreakpoint> extends Ref<infer T> ? T : never
> | null = null;

// =========================================================================
// Helpers
// =========================================================================

/**
 * Determine whether swipe detection is allowed right now.
 * Returns false if no model is registered, the viewport is not mobile,
 * or the user is not using touch input.
 */
function shouldTrack(): boolean {
  if (activeModel === null) return false;
  if (!breakpointRef || breakpointRef.value !== "mobile") return false;
  if (!document.documentElement.classList.contains("user-input-touch"))
    return false;
  return true;
}

// =========================================================================
// Touch event handlers
// =========================================================================

/**
 * Handle touchstart: begin tracking if the touch starts at the correct edge.
 * - Left edge + model is false → track "open" gesture
 * - Right edge + model is true  → track "close" gesture
 */
function handleTouchStart(e: TouchEvent): void {
  if (!shouldTrack() || !activeModel) return;

  const touch = e.touches[0];
  const isOpenGesture = touch.clientX <= EDGE_THRESHOLD && !activeModel.value;
  const isCloseGesture =
    touch.clientX >= window.innerWidth - EDGE_THRESHOLD && activeModel.value;

  if (isOpenGesture) {
    tracking = true;
    trackingDirection = "open";
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  } else if (isCloseGesture) {
    tracking = true;
    trackingDirection = "close";
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }
}

/**
 * Handle touchmove: accumulate displacement and check thresholds.
 * Direction check depends on the current tracking direction:
 * - "open"  → requires rightward movement (deltaX > 0)
 * - "close" → requires leftward movement (deltaX < 0)
 * Both require horizontal dominance over vertical movement.
 */
function handleTouchMove(e: TouchEvent): void {
  if (!tracking || !activeModel) return;

  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const absDeltaX = Math.abs(deltaX);
  const absDeltaY = Math.abs(deltaY);

  if (trackingDirection === "open") {
    // Require rightward movement
    if (deltaX <= 0) {
      resetTracking();
      return;
    }

    // Require horizontal dominance
    if (absDeltaX <= absDeltaY * DIRECTION_RATIO) {
      resetTracking();
      return;
    }

    // Trigger open
    if (deltaX >= SWIPE_THRESHOLD) {
      activeModel.value = true;
      resetTracking();
    }
  } else if (trackingDirection === "close") {
    // Require leftward movement
    if (deltaX >= 0) {
      resetTracking();
      return;
    }

    // Require horizontal dominance
    if (absDeltaX <= absDeltaY * DIRECTION_RATIO) {
      resetTracking();
      return;
    }

    // Trigger close
    if (absDeltaX >= SWIPE_THRESHOLD) {
      activeModel.value = false;
      resetTracking();
    }
  }
}

/** Handle touchend: reset tracking state. */
function handleTouchEnd(): void {
  resetTracking();
}

/** Reset all tracking state — called on gesture completion or cancellation. */
function resetTracking(): void {
  tracking = false;
  trackingDirection = null;
}

// =========================================================================
// Listener management (ref-counted)
// =========================================================================

/** Add global touch listeners. Called on first consumer mount. */
function addTouchListeners(): void {
  listenerCount++;
  if (listenerCount === 1) {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
  }
}

/** Remove global touch listeners. Called on last consumer unmount. */
function removeTouchListeners(): void {
  listenerCount--;
  if (listenerCount === 0) {
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", handleTouchEnd);
    activeModel = null;
    breakpointRef = null;
  }
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Detect edge-swipe gestures and toggle the given model ref.
 *
 * Only active when:
 * - The viewport is in the mobile breakpoint (≤ 992 px), AND
 * - The user is using touch input (`html.user-input-touch`).
 *
 * Gesture criteria:
 * - **Open** (model is `false`): touch starts within the left edge zone,
 *   moves rightward at least {@link SWIPE_THRESHOLD} px, with horizontal
 *   displacement >1.5× vertical displacement.
 * - **Close** (model is `true`): touch starts within the right edge zone,
 *   moves leftward at least {@link SWIPE_THRESHOLD} px, with the same
 *   horizontal-dominance constraint.
 *
 * @param model - A writable `Ref<boolean>` to toggle on swipe detection.
 */
export function useGesture(model: Ref<boolean>): void {
  // Capture the shared breakpoint ref (useBreakpoint returns a singleton)
  breakpointRef = useBreakpoint();
  activeModel = model;

  onMounted(() => {
    addTouchListeners();
  });

  onBeforeUnmount(() => {
    removeTouchListeners();
  });
}
