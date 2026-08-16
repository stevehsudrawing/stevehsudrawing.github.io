/**
 * Breakpoint composable — reactive viewport-width breakpoint for Vue 3.
 *
 * Returns a SINGLE shared `Ref<Breakpoint>` that all components can observe.
 * The breakpoint is derived from `window.innerWidth` against Bootstrap's
 * `md` (768 px) and `xl` (1200 px) thresholds:
 *
 *   ≤ 768 px  →  "mobile"
 *   ≤ 1200 px →  "tablet"
 *   > 1200 px →  "desktop"
 *
 * Uses a **module-level singleton** pattern: the resize listener is
 * registered once (on first call) and torn down when the last consumer
 * unmounts.  Resize events are throttled via `requestAnimationFrame`.
 *
 * @returns A shared `Ref<Breakpoint>` — all callers see the same value.
 *
 * @example
 * const breakpoint = useBreakpoint();
 * // breakpoint.value === "mobile" | "tablet" | "desktop"
 */

import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";
import type { Breakpoint } from "../types/app";

// =========================================================================
// Module-level shared state (singleton — all components share the same ref)
// =========================================================================

/** Shared breakpoint ref — initialized once, shared across all callers. */
const breakpoint = ref<Breakpoint>(computeBreakpoint());

// ---- Resize listener ref-counting ----

let resizeTicking = false;
let listenerCount = 0;

function handleResize(): void {
  if (!resizeTicking) {
    requestAnimationFrame(() => {
      breakpoint.value = computeBreakpoint();
      resizeTicking = false;
    });
    resizeTicking = true;
  }
}

function addResizeListener(): void {
  listenerCount++;
  if (listenerCount === 1) {
    window.addEventListener("resize", handleResize);
  }
}

function removeResizeListener(): void {
  listenerCount--;
  if (listenerCount === 0) {
    window.removeEventListener("resize", handleResize);
  }
}

// =========================================================================
// Helpers
// =========================================================================

/** Compute the current breakpoint from window.innerWidth. */
function computeBreakpoint(): Breakpoint {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w <= 768) return "mobile";
  if (w <= 1200) return "tablet";
  return "desktop";
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive viewport breakpoint detection.
 * Returns a shared singleton `Ref<Breakpoint>` that updates on window resize.
 */
export function useBreakpoint(): Ref<Breakpoint> {
  onMounted(() => {
    // Sync on mount in case the breakpoint changed between module init and
    // component mount (e.g. orientation change while page was hidden).
    breakpoint.value = computeBreakpoint();
    addResizeListener();
  });

  onBeforeUnmount(() => {
    removeResizeListener();
  });

  return breakpoint;
}
