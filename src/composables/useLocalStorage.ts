/**
 * Reactive localStorage binding for Vue 3.
 *
 * Returns a ref that reads its initial value from localStorage (falling
 * back to a provided default) and writes changes back automatically.
 * **Module-level singleton per key** — all callers using the same key
 * share the same ref, so changes from one component are instantly
 * visible to all others.
 *
 * Values are JSON-serialized on write so booleans, numbers, and objects
 * round-trip correctly.  Legacy plain-string values stored by non-Vue
 * modules (e.g. "auto", "en") are handled gracefully on read via a
 * try/catch fallback.
 *
 * @param key - localStorage key (e.g. StorageKey.Theme).
 * @param defaultValue - Fallback value when no stored value exists.
 * @returns A mutable ref synced to localStorage, shared across all callers.
 *
 * @example
 * const openInNewTab = useLocalStorage("openExternalLinksInNewTab", true);
 * // openInNewTab.value = false  ->  localStorage updated automatically
 * // All other callers using the same key see the change immediately.
 */
import { ref, watch, type Ref } from "vue";

// =========================================================================
// Module-level ref cache (key -> shared Ref)
// =========================================================================

/** Singleton refs keyed by localStorage key. */
const refCache = new Map<string, Ref<unknown>>();

// =========================================================================
// Composable
// =========================================================================

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  // Return cached singleton if already created for this key
  const cached = refCache.get(key);
  if (cached) return cached as Ref<T>;

  // --- First call for this key: create the shared ref ---

  const stored = localStorage.getItem(key);

  let parsed: T;
  if (stored !== null) {
    try {
      parsed = JSON.parse(stored) as T;
    } catch {
      // Legacy: value was stored as a plain string (e.g. "auto", "en")
      // by non-Vue modules.  Cast to the expected type -- this works
      // for string literal types like ThemeChoice and Lang.
      parsed = stored as unknown as T;
    }
  } else {
    parsed = defaultValue;
  }

  const value = ref<T>(parsed) as Ref<T>;

  watch(
    value,
    (newVal) => {
      localStorage.setItem(key, JSON.stringify(newVal));
    },
    { deep: true },
  );

  refCache.set(key, value);
  return value;
}
