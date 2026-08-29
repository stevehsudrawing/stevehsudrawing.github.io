/**
 * Advanced-feature capability probes (unified platform module).
 *
 * Single home for JS-detected "advanced feature" checks that cannot be
 * expressed as plain CSS/HTML feature detection.  The Swiper v14 browser
 * baseline is the first consumer; future checks should accumulate here.
 *
 * NOTE (deliberate deviation): the project convention prefers feature
 * detection over UA sniffing (see `public/legacy/env-detection.js`).
 * Swiper v14 exposes no feature hook, and it is unclear WHICH single
 * feature causes unsupported browsers to fail — so this module uses a
 * blacklist of known-unsupported browser/version combos instead.
 */

// =========================================================================
// Constants
// =========================================================================

/** Comparable score helper base: score = major * 100 + minor. */
const SAFARI_MIN_SCORE = 16 * 100 + 4; // 16.4
const CHROMIUM_MIN_SCORE = 110 * 100; // 110.0
const FIREFOX_MIN_SCORE = 110 * 100; // 110.0

// =========================================================================
// Helpers
// =========================================================================

/**
 * Extract a comparable version score (`major * 100 + minor`) from a UA
 * string using a regex whose capture group 1 is `<major>.<minor>` or
 * `<major>_<minor>`.
 *
 * @param ua - The user-agent string.
 * @param pattern - Regex with a version capture group.
 * @returns The comparable score, or `NaN` when the pattern does not match.
 */
function getUaScore(ua: string, pattern: RegExp): number {
  const match = pattern.exec(ua);
  if (!match?.[1]) return Number.NaN;
  const [majorPart, minorPart = "0"] = match[1].split(/[._-]/);
  const major = Number.parseInt(majorPart, 10);
  const minor = Number.parseInt(minorPart, 10);
  if (Number.isNaN(major)) return Number.NaN;
  return major * 100 + minor;
}

// =========================================================================
// Capability checks
// =========================================================================

/**
 * Whether the current browser meets the Swiper v14 baseline.
 *
 * Blacklist semantics: returns `false` only for known-unsupported
 * browser/version combos (Safari/iOS < 16.4, Chrome/Edge/Opera < 110,
 * Firefox < 110); any unrecognized UA is treated as supported.
 *
 * @returns `true` when interactive Swiper features can run.
 */
export function isSwiperSupported(): boolean {
  const ua = navigator.userAgent;

  // Safari / iOS Safari (desktop + iPhone/iPad).  Identified by the
  // "Safari" token without Chromium/Firefox markers; version comes from
  // "Version/x.y" (desktop + iOS) or "OS x_y" (iOS).
  if (
    /safari/i.test(ua) &&
    !/chrome|crios|edg(e|ios)?|opr|opios|firefox|fxios/i.test(ua)
  ) {
    let score = getUaScore(ua, /version[\/ ]([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /os ([\d_]+)/i);
    return !(score < SAFARI_MIN_SCORE);
  }

  // Edge (desktop "Edg/" / legacy "Edge/" / iOS "EdgiOS/").
  if (/edg(e|ios)?\//i.test(ua)) {
    let score = getUaScore(ua, /edg\/([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /edgios\/([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /edge\/([\d.]+)/i);
    return !(score < CHROMIUM_MIN_SCORE);
  }

  // Opera (desktop "OPR/" / iOS "OPiOS/").
  if (/\bopr\/|opios\//i.test(ua)) {
    let score = getUaScore(ua, /\bopr\/([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /opios\/([\d.]+)/i);
    return !(score < CHROMIUM_MIN_SCORE);
  }

  // Chrome (desktop / Android / iOS "CriOS/").
  if (/chrome|crios/i.test(ua)) {
    let score = getUaScore(ua, /chrome\/([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /crios\/([\d.]+)/i);
    return !(score < CHROMIUM_MIN_SCORE);
  }

  // Firefox (desktop / iOS "FxiOS/").
  if (/firefox|fxios/i.test(ua)) {
    let score = getUaScore(ua, /firefox\/([\d.]+)/i);
    if (Number.isNaN(score)) score = getUaScore(ua, /fxios\/([\d.]+)/i);
    return !(score < FIREFOX_MIN_SCORE);
  }

  return true;
}
