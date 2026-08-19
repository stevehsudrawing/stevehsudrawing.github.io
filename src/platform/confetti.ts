/**
 * Confetti celebration helper (canvas-confetti).
 *
 * Fires a single, small burst from an element's center (or the viewport
 * center when no element is given).  Strictly gated for accessibility: it
 * is a no-op when the user prefers reduced motion or has disabled
 * animations in settings.
 */
import confetti from "canvas-confetti";
import { getStoredEnableAnimations } from "./storage";

/** Options for `celebrateAt`. */
export interface CelebrateOptions {
  /**
   * Initial particle velocity — controls the burst radius.
   * Lower = tighter burst.  Default 15.
   */
  startVelocity?: number;
  /** Custom origin in [0,1] viewport coordinates (defaults to element center). */
  origin?: { x: number; y: number };
}

/**
 * Fire one small confetti burst from the center of an element.
 *
 * @param element - The element to burst from (e.g. the modal), or null to
 *   use the viewport center.
 * @param colors - Particle colors.
 * @param options - Optional tuning (startVelocity / origin).
 */
export function celebrateAt(
  element: HTMLElement | null,
  colors: string[],
  options: CelebrateOptions = {},
): void {
  // Accessibility gates — no confetti when motion is reduced/disabled.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!getStoredEnableAnimations()) return;

  const startVelocity = options.startVelocity ?? 15;
  let origin = options.origin;
  if (!origin) {
    if (element) {
      const rect = element.getBoundingClientRect();
      origin = {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2) / window.innerHeight,
      };
    } else {
      origin = { x: 0.5, y: 0.5 };
    }
  }

  confetti({
    particleCount: 90,
    spread: 360,
    startVelocity,
    scalar: 0.9,
    ticks: 120,
    gravity: 0.5,
    origin,
    colors,
    disableForReducedMotion: true,
    zIndex: 1054,
  });
}
