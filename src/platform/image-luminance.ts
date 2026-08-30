/**
 * Image-luminance platform service — loads a same-origin image, crops an
 * edge band (top / bottom / left / right) into a tiny offscreen canvas,
 * and classifies the buffer via the core pure function (isImgDark).
 * Results are cached per URL + region at module level (Single Source of
 * Truth).
 *
 * Consumers pick the region that matters for their overlay:
 *   - `Carousel.vue`: bottom 5% (controls group sits on the bottom edge).
 *   - `PictureViewerModal.vue` fallback: left / right 10% (arrows flank
 *     the left and right edges; each side is sampled independently).
 * Same-origin only — a tainted canvas (cross-origin image without CORS)
 * resolves `false`.
 */
import { isImgDark } from "../core/image-luminance";

// =========================================================================
// Constants
// =========================================================================

/** Max long-side sample size in px (keeps the offscreen canvas tiny). */
const MAX_SAMPLE_SIZE = 64;

// =========================================================================
// Types
// =========================================================================

/** Which image edge to sample. */
export type ImageEdge = "top" | "bottom" | "left" | "right";

/** Sample region: an edge plus its band thickness ratio. */
export interface ImageEdgeRegion {
  /** Edge to crop along. */
  edge: ImageEdge;
  /** Band thickness as a ratio of the perpendicular image side (0-1). */
  ratio: number;
}

// =========================================================================
// Module-level cache
// =========================================================================

/** Promise cache keyed by `src|edge|ratio` (Single Source of Truth). */
const CACHE = new Map<string, Promise<boolean>>();

// =========================================================================
// Helpers (private)
// =========================================================================

/**
 * Draw only the image's requested edge band into a canvas and classify it.
 *
 * Left/right bands span the full image height; top/bottom bands span the
 * full image width.  The band thickness is `ratio` of the perpendicular
 * side (e.g. `{ edge: "left", ratio: 0.1 }` samples the leftmost 10%
 * width).
 *
 * @param image - A fully loaded same-origin image.
 * @param region - Which edge + how thick the band is.
 * @returns `true` when the band's mean luminance is dark.
 */
function sampleEdge(image: HTMLImageElement, region: ImageEdgeRegion): boolean {
  const srcWidth = image.naturalWidth;
  const srcHeight = image.naturalHeight;
  if (srcWidth === 0 || srcHeight === 0) return false;

  const scale = Math.min(1, MAX_SAMPLE_SIZE / Math.max(srcWidth, srcHeight));
  const dstWidth = Math.max(1, Math.round(srcWidth * scale));
  const dstHeight = Math.max(1, Math.round(srcHeight * scale));

  const horizontal = region.edge === "left" || region.edge === "right";
  const bandPx = Math.max(
    1,
    Math.round((horizontal ? srcWidth : srcHeight) * region.ratio),
  );
  const dstBandPx = Math.max(
    1,
    Math.round((horizontal ? dstWidth : dstHeight) * region.ratio),
  );

  const canvas = document.createElement("canvas");
  canvas.width = horizontal ? dstBandPx : dstWidth;
  canvas.height = horizontal ? dstHeight : dstBandPx;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  // Source rectangle: the stripe along the requested edge.
  let sx = 0;
  let sy = 0;
  if (region.edge === "right") sx = srcWidth - bandPx;
  else if (region.edge === "bottom") sy = srcHeight - bandPx;
  ctx.drawImage(
    image,
    sx,
    sy,
    horizontal ? bandPx : srcWidth,
    horizontal ? srcHeight : bandPx,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return isImgDark(data);
}

// =========================================================================
// Public API
// =========================================================================

/**
 * Analyze whether an edge band of an image URL is dark (cached).
 *
 * @param src - Same-origin image URL to analyze.
 * @param region - Edge + band thickness (see {@link ImageEdgeRegion}).
 * @returns Promise of `isDark`; resolves `false` on any failure.
 */
export function isImageEdgeDark(
  src: string,
  region: ImageEdgeRegion,
): Promise<boolean> {
  const cacheKey = `${src}|${region.edge}|${region.ratio}`;
  let promise = CACHE.get(cacheKey);
  if (!promise) {
    promise = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        try {
          resolve(sampleEdge(image, region));
        } catch {
          resolve(false);
        }
      };
      image.onerror = () => resolve(false);
      image.src = src;
    });
    CACHE.set(cacheKey, promise);
  }
  return promise;
}
