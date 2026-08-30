/**
 * Image-luminance platform service — loads a same-origin image, crops its
 * bottom band into a tiny offscreen canvas, and classifies the buffer via
 * the core pure function (isImgDark).  Results are cached per URL at
 * module level (Single Source of Truth).
 *
 * The bottom band is the only region that matters here: the carousel
 * controls group overlays the bottom edge of the hero image, so
 * top/left/right edges are irrelevant.  Same-origin only — a tainted
 * canvas (cross-origin image without CORS) resolves `false`.
 */
import { isImgDark } from "../core/image-luminance";

// =========================================================================
// Constants
// =========================================================================

/** Bottom band thickness as a ratio of the shorter image side. */
const BOTTOM_BAND_RATIO = 0.05;

/** Max long-side sample size in px (keeps the offscreen canvas tiny). */
const MAX_SAMPLE_SIZE = 64;

// =========================================================================
// Module-level cache
// =========================================================================

/** Promise cache keyed by image URL (Single Source of Truth). */
const CACHE = new Map<string, Promise<boolean>>();

// =========================================================================
// Helpers (private)
// =========================================================================

/**
 * Draw only the image's bottom band into a canvas and classify it.
 *
 * @param image - A fully loaded same-origin image.
 * @returns `true` when the bottom-band mean luminance is dark.
 */
function sampleBottomBand(image: HTMLImageElement): boolean {
  const srcWidth = image.naturalWidth;
  const srcHeight = image.naturalHeight;
  if (srcWidth === 0 || srcHeight === 0) return false;

  const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(srcWidth, srcHeight));
  const dstWidth = Math.max(1, Math.round(srcWidth * scale));
  const dstHeight = Math.max(1, Math.round(srcHeight * scale));
  const bandHeight = Math.max(1, Math.round(dstHeight * BOTTOM_BAND_RATIO));
  const srcBandHeight = Math.max(1, Math.round(srcHeight * BOTTOM_BAND_RATIO));

  const canvas = document.createElement("canvas");
  canvas.width = dstWidth;
  canvas.height = bandHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  // Source rectangle: the bottom stripe of the full-size image.
  ctx.drawImage(
    image,
    0,
    srcHeight - srcBandHeight,
    srcWidth,
    srcBandHeight,
    0,
    0,
    dstWidth,
    bandHeight,
  );

  const { data } = ctx.getImageData(0, 0, dstWidth, bandHeight);
  return isImgDark(data);
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Analyze whether the bottom band of an image URL is dark (cached).
 *
 * @param src - Same-origin image URL to analyze.
 * @returns Promise of `isDark`; resolves `false` on any failure.
 */
export function isImageBottomBandDark(src: string): Promise<boolean> {
  let promise = CACHE.get(src);
  if (!promise) {
    promise = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        try {
          resolve(sampleBottomBand(image));
        } catch {
          resolve(false);
        }
      };
      image.onerror = () => resolve(false);
      image.src = src;
    });
    CACHE.set(src, promise);
  }
  return promise;
}
