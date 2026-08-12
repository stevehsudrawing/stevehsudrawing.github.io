/**
 * Read a CSS custom property from the document root with a fallback.
 *
 * Similar to i18n's t(key, fallback): if the property is not set,
 * empty, or unavailable (SSR), the fallback value is returned.
 *
 * @param prop - CSS custom property name with leading `--` (e.g. "--shlh-primary").
 * @param fallback - Value returned when the property is unavailable or empty.
 * @returns The trimmed CSS property value, or the fallback.
 *
 * @example
 * cssVar("shlh-primary", "#3078cc")        // → "#3078cc"
 * cssVar("nonexistent", "rgb(0,0,0)")      // → "rgb(0,0,0)"
 */
export function cssVar(prop: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--${prop}`)
    .trim();
  return value || fallback;
}
