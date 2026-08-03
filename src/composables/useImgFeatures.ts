/**
 * Image features composable -- colored masks and loading opacity.
 *
 * Extracted from FeatureAwareImg.vue (§4.8).  Provides the global
 * document scan for build-time injected [data-img-feature] images
 * outside Vue's render tree.
 */

/**
 * Apply colored mask styling to a single image.
 */
function applyColoredImage(img: HTMLImageElement): void {
  const maskSrc = img.getAttribute("data-src-mask");
  if (maskSrc) {
    img.style.setProperty("--img-mask-url", `url(${maskSrc})`);
  }
  const cv = img.getAttribute("data-color-var");
  if (cv) {
    img.style.setProperty("--img-color", `var(--${cv})`);
  }
}

/** Initialize all images with data-img-feature~="colored". */
export function initAllColoredImages(): void {
  document
    .querySelectorAll<HTMLImageElement>('img[data-img-feature~="colored"]')
    .forEach(applyColoredImage);
}

/** Mark an image as loaded. */
export function markImageLoaded(img: HTMLImageElement): void {
  img.setAttribute("data-img-loaded", "");
}

/** Mark an image as unloaded (revert to semi-transparent). */
export function markImageUnloaded(img: HTMLImageElement): void {
  img.removeAttribute("data-img-loaded");
}

/** Initialize loading opacity on a single image. */
export function initImageLoadingOpacity(img: HTMLImageElement): void {
  if (img.matches('[data-img-feature~="colored"]')) return;
  if (img.complete && img.naturalWidth > 0) {
    markImageLoaded(img);
  } else {
    img.addEventListener("load", () => markImageLoaded(img), { once: true });
    img.addEventListener("error", () => markImageLoaded(img), { once: true });
  }
}

/** Initialize loading opacity for all images on the page. */
export function initAllImageLoadingOpacity(): void {
  document
    .querySelectorAll<HTMLImageElement>("img")
    .forEach(initImageLoadingOpacity);
}
