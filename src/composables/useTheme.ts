/**
 * Theme composable -- reactive theme state for Vue 3.
 *
 * Provides a SINGLE source of truth for the user's theme preference
 * (auto / light / dark) and the resolved effective theme.  The
 * preference ref is a module-level singleton so all components
 * that call useTheme() share the same reactive state.
 *
 * Coexists with ui/theme.ts: the composable owns the reactive STATE;
 * the imperative module (ui/theme.ts) still performs DOM manipulation
 * (overlay transitions, image swapping, favicon updates) via its
 * existing exported functions.
 */

import { ref, computed, watch, onMounted, onUnmounted, type Ref } from "vue";
import { useLocalStorage } from "./useLocalStorage";
import type { ThemeChoice, EffectiveTheme } from "../types/app";
import { StorageKey } from "../types/app";

// =========================================================================
// Module-level shared state (singleton — all components share the same ref)
// =========================================================================

/** Shared theme preference ref — initialized once, shared across all callers. */
const preference = useLocalStorage<ThemeChoice>(
  StorageKey.Theme,
  "auto",
) as Ref<ThemeChoice>;

/** Shared system-dark-mode ref. */
const systemIsDark = ref(
  window.matchMedia("(prefers-color-scheme: dark)").matches,
);

/** Shared effective theme — derived from preference + system preference. */
const effectiveTheme = computed<EffectiveTheme>(() =>
  preference.value === "auto"
    ? systemIsDark.value
      ? "dark"
      : "light"
    : (preference.value as EffectiveTheme),
);

// ---- System theme listener (shared — one global listener) ----

let mediaQuery: MediaQueryList | null = null;
let mediaHandler: ((e: MediaQueryListEvent) => void) | null = null;
let listenerCount = 0;

function addSystemListener(): void {
  listenerCount++;
  if (listenerCount === 1) {
    mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaHandler = (e: MediaQueryListEvent) => {
      systemIsDark.value = e.matches;
    };
    mediaQuery.addEventListener("change", mediaHandler);
  }
}

function removeSystemListener(): void {
  listenerCount--;
  if (listenerCount === 0 && mediaQuery && mediaHandler) {
    mediaQuery.removeEventListener("change", mediaHandler);
    mediaQuery = null;
    mediaHandler = null;
  }
}

// ---- Effective theme → DOM sync (shared — one global watcher) ----

watch(effectiveTheme, (theme) => {
  document.documentElement.setAttribute("data-bs-theme", theme);

  // Delegate to ui/theme.ts for image swapping, favicon updates, etc.
  import("../ui/theme").then(
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

// =========================================================================
// Composable (returns shared state + per-component lifecycle hooks)
// =========================================================================

/** Reactive localStorage-backed theme preference. */
export function useTheme(): {
  /** User-chosen theme: 'auto', 'light', or 'dark'. */
  preference: Ref<ThemeChoice>;
  /** Resolved theme: 'light' or 'dark' (auto -> system preference). */
  effectiveTheme: Ref<EffectiveTheme>;
  /** Directly set the preference and apply it via ui/theme.ts. */
  setPreference: (choice: ThemeChoice) => void;
} {
  // Per-component: register system theme listener
  onMounted(addSystemListener);
  onUnmounted(removeSystemListener);

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
    import("../ui/theme").then(({ setThemePreference }) => {
      setThemePreference(choice);
    });
  }

  return { preference, effectiveTheme, setPreference };
}
