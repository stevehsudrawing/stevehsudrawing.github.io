/**
 * Edge-luminance composable — decides whether an image is "dark near its
 * edges" so overlay controls can pick a contrasting color.
 *
 * Samples the inner-edge band (thickness = 15% of the shorter side) of
 * the image drawn to a small offscreen canvas, averages the relative
 * luminance (0.2126 R + 0.7152 G + 0.0722 B), and reports
 * `isDark = mean < 0.5`.  Results are cached per URL at module level
 * (Single Source of Truth).  Only same-origin images are analyzed (the
 * canvas must not be tainted).
 */
import { onScopeDispose, ref, watch, type Ref } from "vue";

// =========================================================================
// Constants
// =========================================================================

/** Band thickness along each edge, as a ratio of the shorter side. */
const EDGE_BAND_RATIO = 0.15;

/** Mean-luminance threshold (0–1) below which the image counts as dark. */
const LUMINANCE_THRESHOLD = 0.5;

/** Maximum long-side sample size in px (keeps the canvas tiny). */
const MAX_SAMPLE_SIZE = 64;

// =========================================================================
// Module-level cache
// =========================================================================

/** Promise cache keyed by image URL (Single Source of Truth). */
const CACHE = new Map<string, Promise<boolean>>();

// =========================================================================
// Helpers
// =========================================================================

/**
 * Compute whether the drawn image is dark near its edges.
 *
 * @param image - A fully loaded image element (same origin).
 * @returns `true` when the band mean luminance is below the threshold.
 */
function sampleEdgeLuminance(image: HTMLImageElement): boolean {
  const scale = Math.min(
    1,
    MAX_SAMPLE_SIZE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;
  ctx.drawImage(image, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

  const band = Math.max(
    1,
    Math.round(Math.min(width, height) * EDGE_BAND_RATIO),
  );
  let sum = 0;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inBand =
        x < band || x >= width - band || y < band || y >= height - band;
      if (!inBand) continue;
      const i = (y * width + x) * 4;
      const r = data[i] ?? 0;
      const g = data[i + 1] ?? 0;
      const b = data[i + 2] ?? 0;
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      count += 1;
    }
  }
  if (count === 0) return false;
  return sum / count < LUMINANCE_THRESHOLD * 255;
}

/**
 * Analyze an image URL (cached).
 *
 * @param src - Same-origin image URL to analyze.
 * @returns Promise of `isDark`; resolves `false` on any failure.
 */
function analyze(src: string): Promise<boolean> {
  let promise = CACHE.get(src);
  if (!promise) {
    promise = new Promise<boolean>((resolve) => {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => {
        try {
          resolve(sampleEdgeLuminance(image));
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

// =========================================================================
// Composable
// =========================================================================

/**
 * Reactive edge-luminance detection for the given image source.
 *
 * @param src - Ref holding the currently displayed image URL (or `null`).
 * @returns `isDark` (`null` while loading / no src, else boolean).
 */
export function useEdgeLuminance(src: Ref<string | null>): {
  isDark: Ref<boolean | null>;
} {
  const isDark = ref<boolean | null>(null);

  watch(
    src,
    (value) => {
      isDark.value = null;
      if (!value) return;
      const token = value;
      void analyze(value).then((dark) => {
        // Ignore stale results after a rapid slide change.
        if (src.value === token) isDark.value = dark;
      });
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    isDark.value = null;
  });

  return { isDark };
}
