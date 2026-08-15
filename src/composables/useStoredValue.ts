/**
 * Reactive binding for a stored preference.
 *
 * Wraps a typed storage accessor pair (getStoredX / setStoredX from
 * src/platform/storage.ts) in a Vue ref: the ref initializes from the
 * getter and writes changes back through the setter.  Module-level
 * singleton per getter function — all callers using the same accessor
 * share the same ref.
 *
 * MANDATORY: only pass real storage accessors from platform/storage.ts.
 * Never pass ad-hoc lambdas that touch localStorage directly.
 */

import { ref, watch, type Ref } from "vue";

// =========================================================================
// Module-level ref cache (getter function -> shared Ref)
// =========================================================================

/** Singleton refs keyed by the accessor's getter function. */
const refCache = new Map<() => unknown, Ref<unknown>>();

// =========================================================================
// Composable
// =========================================================================

/**
 * Bind a stored value to a reactive ref.
 *
 * @param get - Storage getter (e.g. getStoredOpenInNewTab).
 * @param set - Storage setter (e.g. setStoredOpenInNewTab).
 * @param defaultValue - Fallback used when the getter returns null.
 * @returns A mutable ref synced to storage, shared across all callers.
 */
export function useStoredValue<T>(
  get: () => T | null,
  set: (value: T) => void,
  defaultValue: T,
): Ref<T> {
  // Return cached singleton if already created for this accessor
  const cached = refCache.get(get);
  if (cached) return cached as Ref<T>;

  const initial = get();
  const value = ref<T>(initial === null ? defaultValue : initial) as Ref<T>;

  watch(
    value,
    (newVal) => {
      set(newVal);
    },
    { deep: true },
  );

  refCache.set(get, value);
  return value;
}
