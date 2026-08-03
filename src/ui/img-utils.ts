/**
 * Image utilities bridge -- delegates to the composable.
 *
 * The useImgFeatures composable handles colored masks and loading opacity.
 * Single-element ops stay here; batch ops delegate to the composable.
 */

import {
  initAllColoredImages,
  initAllImageLoadingOpacity,
  markImageLoaded,
  markImageUnloaded,
  initImageLoadingOpacity,
} from "../composables/useImgFeatures.js";

export function applyColoredImage(img: HTMLImageElement): void {
  const maskSrc = img.getAttribute("data-src-mask");
  if (maskSrc) {
    img.style.setProperty("--img-mask-url", `url(${maskSrc})`);
  }
  const cv = img.getAttribute("data-color-var");
  if (cv) {
    img.style.setProperty("--img-color", `var(--${cv})`);
  }
}

export {
  initAllColoredImages,
  initAllImageLoadingOpacity,
  markImageLoaded,
  markImageUnloaded,
  initImageLoadingOpacity,
};
