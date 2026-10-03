/**
 * Drag state composable — the shared pointer-driven `is-dragging` state
 * behind the `.drag-cursor` cursor pair (base.css).
 *
 * A primary-button `pointerdown` starts the drag; the first
 * `pointerup` / `pointercancel` / `blur` on `window` ends it (the
 * listeners then remove themselves).  No pointer capture is used — the
 * drag surfaces sit on top of pointer-driven libraries (Swiper /
 * skinview3d) that must keep receiving their own pointer stream, and the
 * drag state only drives CSS.
 */

import { onBeforeUnmount, ref, type Ref } from "vue";

// =========================================================================
// Composable
// =========================================================================

/**
 * Pointer-driven drag state for the `.drag-cursor` utility pair.
 *
 * @returns `isDragging` — bind it to the surface's `is-dragging` class —
 *   and `onPointerDown` — bind it to the surface's `pointerdown` event.
 * @example
 * const { isDragging, onPointerDown } = useDragState();
 * // <div class="drag-cursor" :class="{ 'is-dragging': isDragging }"
 * //      @pointerdown="onPointerDown">
 */
export function useDragState(): {
  isDragging: Ref<boolean>;
  onPointerDown: (event: PointerEvent) => void;
} {
  const isDragging = ref(false);

  /** Ends the drag and detaches the window listeners (idempotent). */
  function endDrag(): void {
    isDragging.value = false;
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.removeEventListener("blur", endDrag);
  }

  /** Starts the drag on a primary-button press. */
  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    isDragging.value = true;
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("blur", endDrag);
  }

  onBeforeUnmount(endDrag);

  return { isDragging, onPointerDown };
}
