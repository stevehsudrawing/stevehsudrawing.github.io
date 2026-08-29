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
export const BOTTOM_BAND_RATIO = 0.15;

/** Max long-side sample size in px (keeps the offscreen canvas tiny). */
export const MAX_SAMPLE_SIZE = 64;

// =========================================================================
// Module-level cache
// =========================================================================

/** Promise cache keyed by image URL (Single Source of Truth). */
const CACHE = new Map<string, Promise<boolean>>();

// =========================================================================
// Types
// =========================================================================

/** Options for isImageBottomBandDark. */
export interface ImageLuminanceOptions {
  /** Bottom band thickness as a ratio of the shorter side (default 0.15). */
  bandRatio?: number;
  /** Max long-side sample size in px (default 64). */
  maxSampleSize?: number;
}

// =========================================================================
// Helpers (private)
// =========================================================================

/**
 * Draw only the image's bottom band into a canvas and classify it.
 *
 * @param image - A fully loaded same-origin image.
 * @param options - Resolved band / sample options.
 * @returns `true` when the bottom-band mean luminance is dark.
 */
function sampleBottomBand(
  image: HTMLImageElement,
  options: Required<ImageLuminanceOptions>,
): boolean {
  const srcWidth = image.naturalWidth;
  const srcHeight = image.naturalHeight;
  if (srcWidth === 0 || srcHeight === 0) return false;

  const scale = Math.min(
    1,
    options.maxSampleSize / Math.max(srcWidth, srcHeight),
  );
  const dstWidth = Math.max(1, Math.round(srcWidth * scale));
  const dstHeight = Math.max(1, Math.round(srcHeight * scale));
  const bandHeight = Math.max(1, Math.round(dstHeight * options.bandRatio));
  const srcBandHeight = Math.max(1, Math.round(srcHeight * options.bandRatio));

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
 * Note: the cache is keyed by URL only; callers should keep using the
 * same options for a given URL.
 *
 * @param src - Same-origin image URL to analyze.
 * @param options - Optional band / sample overrides.
 * @returns Promise of `isDark`; resolves `false` on any failure.
 */
export function isImageBottomBandDark(
  src: string,
  options?: ImageLuminanceOptions,
): Promise<boolean> {
  const effective: Required<ImageLuminanceOptions> = {
    bandRatio: options?.bandRatio ?? BOTTOM_BAND_RATIO,
    maxSampleSize: options?.maxSampleSize ?? MAX_SAMPLE_SIZE,
  };
  let promise = CACHE.get(src);
  if (!promise) {
    promise = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        try {
          resolve(sampleBottomBand(image, effective));
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
