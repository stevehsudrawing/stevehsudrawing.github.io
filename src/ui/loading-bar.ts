/**
 * Loading bar bridge -- delegates to the Vue LoadingBar component.
 *
 * The Vue LoadingBar component renders #loading-bar in its own template
 * and exposes show / complete / hide.  This module provides a thin bridge
 * for legacy TS consumers (lang-switcher.ts, page-transition.ts).
 */

function getBar(): NonNullable<Window["__loadingBar"]> | null {
  return window.__loadingBar ?? null;
}

/**
 * Show the progress bar and animate it to ~85 %.
 */
export function showLoadingBar(): void {
  getBar()?.show();
}

/**
 * Complete the progress bar: animate to 100 % then fade out.
 */
export function completeLoadingBar(): void {
  getBar()?.complete();
}

/**
 * Immediately hide the progress bar without the completion animation.
 */
export function hideLoadingBar(): void {
  getBar()?.hide();
}
