/**
 * Theme composable — reactive theme state for Vue 3.
 *
 * Provides a single source of truth for the user's theme preference
 * (auto / light / dark) and the resolved effective theme.
 *
 * Coexists with ui/theme.ts: the composable owns the reactive STATE;
 * the imperative module (ui/theme.ts) still performs DOM manipulation
 * (overlay transitions, image swapping, favicon updates) via its
 * existing exported functions.
 *
 * Once all consumers migrate to Vue components, ui/theme.ts will be
 * fully replaced by this composable + component-scoped logic.
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref } from "vue";
import { useLocalStorage } from "./useLocalStorage.js";
import type { ThemeChoice, EffectiveTheme } from "../types/app.js";
import { StorageKey } from "../types/app.js";

/** Reactive localStorage-backed theme preference. */
export function useTheme(): {
  /** User-chosen theme: 'auto', 'light', or 'dark'. */
  preference: Ref<ThemeChoice>;
  /** Resolved theme: 'light' or 'dark' (auto → system preference). */
  effectiveTheme: Ref<EffectiveTheme>;
  /** Directly set the preference and apply it via ui/theme.ts. */
  setPreference: (choice: ThemeChoice) => void;
} {
  // --- State ---
  const preference = useLocalStorage<ThemeChoice>(
    StorageKey.Theme,
    "auto",
  ) as Ref<ThemeChoice>;

  const systemIsDark = ref(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  const effectiveTheme = computed<EffectiveTheme>(() =>
    preference.value === "auto"
      ? systemIsDark.value
        ? "dark"
        : "light"
      : (preference.value as EffectiveTheme),
  );

  // --- System theme listener ---
  let mediaQuery: MediaQueryList | null = null;
  let handler: ((e: MediaQueryListEvent) => void) | null = null;

  onMounted(() => {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    handler = (e: MediaQueryListEvent) => {
      systemIsDark.value = e.matches;
    };
    mediaQuery.addEventListener("change", handler);
  });

  onUnmounted(() => {
    if (mediaQuery && handler) {
      mediaQuery.removeEventListener("change", handler);
    }
  });

  // --- Sync effectiveTheme → DOM via existing imperative module ---
  watch(effectiveTheme, (theme) => {
    document.documentElement.setAttribute("data-bs-theme", theme);

    // Delegate to ui/theme.ts for image swapping, favicon updates, etc.
    // Dynamic import avoids circular dependency with the existing module.
    import("../ui/theme.js").then(
      ({
        applyAllThemeBasedImages,
        applyAllThemeBasedSources,
        applyAllFaviconThemes,
      }) => {
        applyAllThemeBasedImages();
        applyAllThemeBasedSources();
        applyAllFaviconThemes();
      },
    );
  });

  // --- Actions ---

  /**
   * Set the theme preference.
   * Writes to localStorage (via useLocalStorage watch) and applies
   * the full theme change including overlay transition via ui/theme.ts.
   */
  function setPreference(choice: ThemeChoice): void {
    preference.value = choice;

    // Also update the legacy mutable state and run the overlay
    // transition via the existing imperative module.
    import("../ui/theme.js").then(({ setThemePreference }) => {
      setThemePreference(choice);
    });
  }

  return { preference, effectiveTheme, setPreference };
}
