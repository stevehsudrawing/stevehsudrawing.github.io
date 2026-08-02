/**
 * Loading bar bridge — delegates to the Vue LoadingBar component.
 *
 * The static HTML (#page-transition-progress) is injected at build time
 * via build/page-components/header.html.  The Vue LoadingBar component
 * owns the CSS and reactive state; this module provides a thin bridge
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
