/**
 * Theme management module.
 * Supports light, dark, and auto (follow system) themes using Bootstrap's
 * data-bs-theme attribute. Handles persistence, system preference listening,
 * theme-aware image swapping, and UI toggle synchronization.
 */

import type { ThemeChoice, EffectiveTheme } from "../types/app";
import { StorageKey } from "../types/app";

const htmlElement: HTMLElement = document.documentElement;

const supportedThemes = ["auto", "light", "dark"] as const;

/** Monotonic counter to cancel superseded transition callbacks. */
let themeTransitionId = 0;

const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * Query the OS-level color scheme preference.
 * @returns The current system theme.
 */
function getSystemTheme(): EffectiveTheme {
  return prefersColorScheme.matches ? "dark" : "light";
}

/**
 * Resolve a theme choice to the effective 'light' or 'dark' value
 * that will be applied to data-bs-theme.
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @returns The effective theme.
 */
function getEffectiveTheme(themeChoice: ThemeChoice): EffectiveTheme {
  if (themeChoice === "auto") return getSystemTheme();
  return themeChoice as EffectiveTheme;
}

/**
 * Apply the raw theme change (data-bs-theme + images) immediately.
 * Callers are responsible for overlay timing if a visual transition is desired.
 * @param theme - The resolved theme value ('light', 'dark', or 'auto').
 */
export function applyThemeChange(theme: string): void {
  if (theme === "auto") {
    htmlElement.setAttribute("data-bs-theme", getSystemTheme());
  } else {
    htmlElement.setAttribute("data-bs-theme", theme);
  }
  applyAllFaviconThemes();
}

/**
 * Apply a theme choice to the page. When 'auto', defer to the system theme.
 * Creates a full-page overlay dynamically for smooth crossfade, then
 * removes it after the transition completes — avoids permanent backdrop-filter
 * GPU compositing overhead.
 *
 * Persistence (localStorage) is owned by useLocalStorage() in useTheme.ts;
 * this function only handles DOM side-effects.
 *
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @param useOverlay - When false, skip the transition overlay (used during initial page load).
 */
export function applyThemePreference(
  themeChoice: ThemeChoice,
  useOverlay = true,
): void {
  const theme: ThemeChoice = (supportedThemes as readonly string[]).includes(
    themeChoice,
  )
    ? themeChoice
    : "auto";

  // Skip the overlay (instant switch) when:
  // - User prefers reduced motion, or
  // - The effective theme does not actually change, or
  // - useOverlay is explicitly false (e.g. initial page load).
  const skipOverlay =
    !useOverlay ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    htmlElement.getAttribute("data-bs-theme") === getEffectiveTheme(theme);

  if (skipOverlay) {
    applyThemeChange(theme);
    return;
  }

  // Increment ID to cancel any pending callback from rapid toggling.
  const thisId = ++themeTransitionId;

  // Create overlay dynamically so backdrop-filter does not live
  // in the DOM permanently (avoids unnecessary GPU compositing).
  const overlay = document.createElement("div");
  overlay.className = "theme-transition-overlay";
  document.body.appendChild(overlay);

  // Force reflow so the browser registers the initial state, then
  // add the active class to trigger the fade-in transition.
  void overlay.offsetWidth;
  overlay.classList.add("active");

  // After fade-in completes, switch theme behind the opaque overlay.
  setTimeout(function () {
    if (thisId !== themeTransitionId) {
      overlay.remove();
      return;
    }

    applyThemeChange(theme);

    // Fade out the overlay to reveal the new theme.
    overlay.classList.remove("active");
    overlay.classList.add("fade-out");

    // Remove overlay after fade-out transition completes.
    // The longest fade-out transition is background-color at 1 s.
    setTimeout(() => {
      overlay.remove();
    }, 1050);
  }, 500);
}

/**
 * Called when the system color scheme changes. If the user has chosen 'auto',
 * update the data-bs-theme attribute and refresh theme-based images.
 * No overlay is used - system-initiated changes should be subtle.
 */
function updateAutoThemeOnSystemChange(): void {
  const pref = localStorage.getItem(StorageKey.Theme) ?? "auto";
  if (pref !== "auto") return;
  applyThemeChange("auto");
}

/**
 * Apply the current theme's favicon to a single <link rel="icon"> element.
 * Swaps the href between light and dark variants using file-naming convention:
 * general.svg / general-dark.svg, general.png / general-dark.png.
 * @param link - The favicon link element to update.
 */
function applyFaviconTheme(link: HTMLLinkElement): void {
  const href = link.getAttribute("href");
  if (!href) return;

  const currentTheme = htmlElement.getAttribute("data-bs-theme");

  if (currentTheme === "dark") {
    // Switch to dark variant: general.ext -> general-dark.ext
    const darkHref = href.replace(/general(?=\.[a-z]+$)/, "general-dark");
    if (darkHref !== href) {
      link.setAttribute("href", darkHref);
    }
  } else {
    // Switch to light variant: general-dark.ext -> general.ext
    const lightHref = href.replace(/general-dark(?=\.[a-z]+$)/, "general");
    if (lightHref !== href) {
      link.setAttribute("href", lightHref);
    }
  }
}

/**
 * Update all favicon <link> elements to match the current theme.
 * Delegates to applyFaviconTheme() for each matching element.
 */
export function applyAllFaviconThemes(): void {
  try {
    document
      .querySelectorAll<HTMLLinkElement>('link[rel="icon"]')
      .forEach(applyFaviconTheme);
  } catch (error) {
    console.error("Failed to apply favicon themes:", error);
  }
}

/**
 * Listen for OS-level color scheme changes and re-apply the theme
 * when the user's preference is 'auto'.
 */
export function initSystemThemeListener(): void {
  prefersColorScheme.addEventListener("change", updateAutoThemeOnSystemChange);
}
