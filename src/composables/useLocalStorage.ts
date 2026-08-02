/**
 * Reactive localStorage binding for Vue 3.
 *
 * Returns a ref that reads its initial value from localStorage (falling
 * back to a provided default) and writes changes back automatically.
 *
 * Values are JSON-serialized on write so booleans, numbers, and objects
 * round-trip correctly.  Legacy plain-string values stored by non-Vue
 * modules (e.g. "auto", "en") are handled gracefully on read via a
 * try/catch fallback.
 *
 * @param key - localStorage key (e.g. StorageKey.Theme).
 * @param defaultValue - Fallback value when no stored value exists.
 * @returns A mutable ref synced to localStorage.
 *
 * @example
 * const openInNewTab = useLocalStorage("openExternalLinksInNewTab", true);
 * // openInNewTab.value = false  →  localStorage updated automatically
 */
import { ref, watch, type Ref } from "vue";

export function useLocalStorage<T>(key: string, defaultValue: T): Ref<T> {
  const stored = localStorage.getItem(key);

  let parsed: T;
  if (stored !== null) {
    try {
      parsed = JSON.parse(stored) as T;
    } catch {
      // Legacy: value was stored as a plain string (e.g. "auto", "en")
      // by non-Vue modules.  Cast to the expected type — this works
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

  return value;
}
