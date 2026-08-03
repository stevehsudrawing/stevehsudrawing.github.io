/**
 * Scroll hint bridge -- delegates to the Vue ScrollHint component.
 *
 * The .link-button-group elements are build-time injected HTML.
 * The Vue ScrollHint component owns the CSS and logic; this module
 * provides a thin bridge for legacy TS consumers.
 */

function getHint(): NonNullable<Window["__scrollHint"]> | null {
  return window.__scrollHint ?? null;
}

export let scrollHintResizeSetup = false;

export function updateScrollHints(): void {
  getHint()?.updateAllHints();
}

export function createScrollHint(group: HTMLElement): void {
  getHint()?.createHint(group);
}

export function removeScrollHint(group: HTMLElement): void {
  getHint()?.removeHint(group);
}

export function initAllScrollHints(): void {
  getHint()?.initAllHints();
}
