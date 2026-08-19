/**
 * Easter-egg config — the two profile "major colors" and the secret
 * sticker-trigger hashes.  Single source of truth: consumed by
 * useMajorColorSequence (unlock pattern) and App.vue (secret-hash
 * sticker trigger).
 */

/** The two profile major colors (About page), in click order. */
export const MAJOR_COLORS = ["#47c4ee", "#3c96ff"] as const;

/**
 * URL hashes that directly open the sticker modal (shareable easter-egg
 * link).  Values include the leading "#" to match vue-router's
 * `route.hash` format.  Typed as `readonly string[]` so callers can use
 * `.includes()` with a plain string.
 */
export const STICKER_TRIGGER_HASHES: readonly string[] = MAJOR_COLORS;
