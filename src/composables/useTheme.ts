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
import { applyThemePreference } from "../ui/theme";

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

// ---- Effective theme -> DOM sync (shared — one global watcher) ----
//
// IMPORTANT: This watcher must NOT set data-bs-theme directly.
// Theme application (data-bs-theme + overlay transition) is owned
// exclusively by ui/theme.ts (applyThemeChange / applyThemePreference).
// Setting data-bs-theme here would race ahead of the overlay code and
// cause skipOverlay to always evaluate true, killing the transition.
//
// This watcher only syncs favicons for system-initiated changes.

watch(effectiveTheme, () => {
  import("../ui/theme").then(({ applyAllFaviconThemes }) => {
    applyAllFaviconThemes();
  });
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

    // Apply DOM side-effects (data-bs-theme + overlay transition + favicon).
    // Persistence is handled by useLocalStorage's watcher on preference.
    applyThemePreference(choice);
  }

  return { preference, effectiveTheme, setPreference };
}
