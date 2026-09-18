/**
 * Theme composable — reactive theme state for Vue 3.
 *
 * Provides a SINGLE source of truth for the user's theme preference
 * (auto / light / dark), the resolved effective theme, and the
 * applied (DOM) theme.  The preference ref is a module-level
 * singleton so all components that call useTheme() share the same
 * reactive state.
 *
 * Coexists with ui/theme.ts: the composable owns the reactive STATE;
 * the imperative module (ui/theme.ts) still performs DOM manipulation
 * (overlay transitions, image swapping, favicon updates) via its
 * existing exported functions.
 */

import { computed, onMounted, onUnmounted, ref, watch, type Ref } from "vue";
import { getStoredTheme, setStoredTheme } from "../platform/storage";
import { applyThemePreference } from "../platform/theme";
import type { EffectiveTheme, ThemeChoice } from "../types/app";
import { useStoredValue } from "./useStoredValue";

// =========================================================================
// Module-level shared state (singleton — all components share the same ref)
// =========================================================================

/** Shared theme preference ref — initialized once, shared across all callers. */
const preference = useStoredValue<ThemeChoice>(
  getStoredTheme,
  setStoredTheme,
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

// ---- Applied theme (the DOM attribute) ----
//
// `appliedTheme` tracks `<html data-bs-theme>` — the theme that is
// actually visible.  It LAGS `effectiveTheme` while the transition
// overlay plays (applyThemePreference() flips the attribute 500 ms
// after the preference changes).  Consumers that read CSS variables
// or swap theme-dependent assets must react to THIS ref — reacting
// to `effectiveTheme` reads the OUTGOING theme's colors.

/** Read the theme currently applied to the DOM. */
function readDomTheme(): EffectiveTheme {
  return document.documentElement.getAttribute("data-bs-theme") === "dark"
    ? "dark"
    : "light";
}

/** Theme currently applied to `<html data-bs-theme>`. */
const appliedTheme = ref<EffectiveTheme>("light");

let appliedThemeSyncStarted = false;

/**
 * Sync `appliedTheme` with the DOM attribute (idempotent — the first
 * useTheme() call starts the observer).  The MutationObserver covers
 * every writer path: the user-preference overlay flip, system 'auto'
 * changes, and the initial load.
 */
function startAppliedThemeSync(): void {
  if (appliedThemeSyncStarted) return;
  appliedThemeSyncStarted = true;
  appliedTheme.value = readDomTheme();
  new MutationObserver(() => {
    appliedTheme.value = readDomTheme();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-bs-theme"],
  });
}

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
// exclusively by platform/theme.ts (applyThemeChange / applyThemePreference).
// Setting data-bs-theme here would race ahead of the overlay code and
// cause skipOverlay to always evaluate true, killing the transition.
//
// This watcher only syncs favicons for system-initiated changes.

watch(effectiveTheme, () => {
  import("../platform/theme").then(({ applyAllFaviconThemes }) => {
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
  /**
   * Theme currently applied to `<html data-bs-theme>`.  Lags
   * `effectiveTheme` during the 500 ms overlay transition — use this
   * to read CSS variables / swap theme-dependent assets.
   */
  appliedTheme: Ref<EffectiveTheme>;
  /** Directly set the preference and apply it via ui/theme.ts. */
  setPreference: (choice: ThemeChoice) => void;
} {
  // Per-component: register system theme listener
  onMounted(addSystemListener);
  onUnmounted(removeSystemListener);

  // Start the DOM-attribute sync (idempotent — first call wins).
  startAppliedThemeSync();

  // --- Actions ---

  /**
   * Set the theme preference.
   * Writes to localStorage (via useStoredValue's watch calling
   * setStoredTheme) and applies the full theme change including
   * overlay transition via ui/theme.ts.
   */
  function setPreference(choice: ThemeChoice): void {
    preference.value = choice;

    // Apply DOM side-effects (data-bs-theme + overlay transition + favicon).
    // Persistence is handled by useStoredValue's watcher on preference.
    applyThemePreference(choice);
  }

  return { preference, effectiveTheme, appliedTheme, setPreference };
}
