/**
 * Image-luminance pure logic — no DOM, no events.
 *
 * The caller (platform/image-luminance.ts) crops the image to the region
 * of interest (bottom band) and passes the raw RGBA buffer; this module
 * only knows how to average relative luminance and classify it.
 */

// =========================================================================
// Constants
// =========================================================================

/** Relative-luminance coefficient for red (ITU-R BT.601). */
const LUMINANCE_COEFF_R = 0.2126;

/** Relative-luminance coefficient for green (ITU-R BT.601). */
const LUMINANCE_COEFF_G = 0.7152;

/** Relative-luminance coefficient for blue (ITU-R BT.601). */
const LUMINANCE_COEFF_B = 0.0722;

/** Alpha below which a pixel counts as transparent and is skipped. */
const ALPHA_SKIP_THRESHOLD = 128;

/** Mean-luminance threshold under which the region counts as dark. */
const LUMINANCE_THRESHOLD = 0.5;

// =========================================================================
// Functions
// =========================================================================

/**
 * Classify a raw RGBA pixel buffer as "dark" or "bright".
 *
 * Iterates the buffer (4 bytes per pixel), skips transparent pixels
 * (alpha < 128), averages the relative luminance
 * (0.2126 r + 0.7152 g + 0.0722 b), and returns whether the mean is
 * below LUMINANCE_THRESHOLD.  Empty / all-transparent buffers are not
 * dark (`false`).  The buffer is expected to be already cropped by the
 * caller — width/height/crop geometry are out of scope here.
 *
 * @param pixels - RGBA pixel data (4 bytes per pixel, any dimensions).
 * @returns `true` when the mean relative luminance is below the threshold.
 */
export function isImgDark(pixels: Uint8ClampedArray): boolean {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3];
    if (alpha < ALPHA_SKIP_THRESHOLD) continue;
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    sum +=
      LUMINANCE_COEFF_R * r + LUMINANCE_COEFF_G * g + LUMINANCE_COEFF_B * b;
    count += 1;
  }
  if (count === 0) return false;
  return sum / count < LUMINANCE_THRESHOLD * 255;
}
