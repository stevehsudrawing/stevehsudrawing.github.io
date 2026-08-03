/**
 * Image utilities bridge — delegates to the Vue FeatureAwareImg component.
 *
 * The FeatureAwareImg component handles loading opacity, colored masks,
 * and theme-based src swapping.  This module provides a thin bridge
 * for legacy TS consumers (page-content-initializer.ts, theme.ts, qr-code.ts).
 */

function get(): NonNullable<Window["__imgUtils"]> | null {
  return window.__imgUtils ?? null;
}

export function applyColoredImage(img: HTMLImageElement): void {
  // Direct DOM fallback — no bridge needed for single-element ops
  const maskSrc = img.getAttribute("data-src-mask");
  if (maskSrc) {
    img.style.setProperty("--img-mask-url", `url(${maskSrc})`);
  }
  const cv = img.getAttribute("data-color-var");
  if (cv) {
    img.style.setProperty("--img-color", `var(--${cv})`);
  }
}

export function initAllColoredImages(): void {
  get()?.initAllColoredImages();
}

export function markImageLoaded(img: HTMLImageElement): void {
  img.setAttribute("data-img-loaded", "");
}

export function markImageUnloaded(img: HTMLImageElement): void {
  img.removeAttribute("data-img-loaded");
}

export function initImageLoadingOpacity(img: HTMLImageElement): void {
  if (img.matches('[data-img-feature~="colored"]')) return;
  if (img.complete && img.naturalWidth > 0) {
    markImageLoaded(img);
  } else {
    img.addEventListener("load", () => markImageLoaded(img), { once: true });
    img.addEventListener("error", () => markImageLoaded(img), { once: true });
  }
}

export function initAllImageLoadingOpacity(): void {
  get()?.initAllImageLoadingOpacity();
}
