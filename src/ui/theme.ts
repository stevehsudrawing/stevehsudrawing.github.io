/**
 * Theme management module.
 * Supports light, dark, and auto (follow system) themes using Bootstrap's
 * data-bs-theme attribute. Handles persistence, system preference listening,
 * theme-aware image swapping, and UI toggle synchronization.
 */

import type { ThemeChoice, EffectiveTheme } from "../types/app";
import { StorageKey } from "../types/app";
import { initImageLoadingOpacity, markImageUnloaded } from "./img-utils";

export const htmlElement: HTMLElement = document.documentElement;

export let currentThemePreference: ThemeChoice = "auto";
export const supportedThemes = ["auto", "light", "dark"] as const;

/** Monotonic counter to cancel superseded transition callbacks. */
export let themeTransitionId = 0;

/**
 * Restore the saved theme preference from localStorage, defaulting to 'auto'.
 */
export function initThemePreference(): void {
  // Get preference if it exists
  const savedTheme = localStorage.getItem(StorageKey.Theme);
  if (
    savedTheme &&
    (supportedThemes as readonly string[]).includes(savedTheme)
  ) {
    currentThemePreference = savedTheme as ThemeChoice;
  }
}

export const prefersColorScheme = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

/**
 * Query the OS-level color scheme preference.
 * @returns The current system theme.
 */
export function getSystemTheme(): EffectiveTheme {
  return prefersColorScheme.matches ? "dark" : "light";
}

/**
 * Resolve a theme choice to the effective 'light' or 'dark' value
 * that will be applied to data-bs-theme.
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @returns The effective theme.
 */
export function getEffectiveTheme(themeChoice: ThemeChoice): EffectiveTheme {
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
  applyAllThemeBasedImages();
  applyAllThemeBasedSources();
  applyAllFaviconThemes();
}

/**
 * Apply a theme choice to the page. When 'auto', defer to the system theme.
 * Creates a full-page overlay dynamically for smooth crossfade, then
 * removes it after the transition completes — avoids permanent backdrop-filter
 * compositing overhead (which interferes with window minimize on Windows).
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @param save - Whether to persist the choice to localStorage.
 * @param useOverlay - When false, skip the transition overlay (used during initial page load).
 */
export function applyThemePreference(
  themeChoice: ThemeChoice,
  save = true,
  useOverlay = true,
): void {
  const theme: ThemeChoice = (supportedThemes as readonly string[]).includes(
    themeChoice,
  )
    ? themeChoice
    : "auto";

  if (save) {
    localStorage.setItem(StorageKey.Theme, theme);
  }

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
  // in the DOM permanently (causes GPU compositing issues on Windows
  // that interfere with window minimize).
  const overlay = document.createElement("div");
  overlay.className = "theme-transition-overlay";
  document.body.appendChild(overlay);

  // Force reflow so the browser registers the initial state, then
  // add the active class to trigger the fade-in transition.
  void overlay.offsetWidth;
  overlay.classList.add("active");

  // Phase 2: After fade-in completes, switch theme behind the opaque overlay.
  setTimeout(function () {
    if (thisId !== themeTransitionId) {
      overlay.remove();
      return;
    }

    applyThemeChange(theme);

    // Phase 3: Fade out the overlay to reveal the new theme.
    overlay.classList.remove("active");
    overlay.classList.add("fade-out");

    // Phase 4: Remove overlay after fade-out transition completes.
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
export function updateAutoThemeOnSystemChange(): void {
  if (currentThemePreference !== "auto") return;
  applyThemeChange("auto");
}

/**
 * Apply the current theme's image source to a single <img> element
 * that has data-img-feature~="follow-theme".
 * Ensures data-src-light is populated on first call so the light
 * source is always recoverable.
 * @param img - The image element to update.
 */
export function applyThemeBasedImage(img: HTMLImageElement): void {
  if (!img.hasAttribute("data-src-light")) {
    img.setAttribute("data-src-light", img.getAttribute("src") || "");
  }

  // Remove loaded marker so the image appears semi-transparent while
  // the new theme variant loads (see img-utils.js loading opacity).
  markImageUnloaded(img);

  const currentTheme = htmlElement.getAttribute("data-bs-theme");
  if (currentTheme === "dark") {
    img.setAttribute("src", img.getAttribute("data-src-dark") || "");
  } else {
    const lightSrc = img.getAttribute("data-src-light");
    if (lightSrc) {
      img.setAttribute("src", lightSrc);
    }
  }

  // Re-mark as loaded once the new src finishes loading.
  // Delegates to img-utils.js which handles both cached and loading images.
  initImageLoadingOpacity(img);
}

/**
 * Swap img[src] with img[data-src-dark] when the current theme is dark,
 * and restore the original light source when switching back.
 * Targets <img> elements with data-img-feature~="follow-theme".
 * Delegates to applyThemeBasedImage() for each matching element.
 */
export function applyAllThemeBasedImages(): void {
  try {
    document
      .querySelectorAll<HTMLImageElement>(
        'img[data-img-feature~="follow-theme"]',
      )
      .forEach(applyThemeBasedImage);
  } catch (error) {
    console.error("Failed to apply theme-based images:", error);
  }
}

/**
 * Apply the current theme's image source to a single <source> element
 * that has data-img-feature~="follow-theme".
 * Ensures data-src-light is populated on first call so the light
 * source is always recoverable.
 * @param source - The source element to update.
 */
export function applyThemeBasedSource(source: HTMLSourceElement): void {
  if (!source.hasAttribute("data-src-light")) {
    source.setAttribute("data-src-light", source.getAttribute("srcset") || "");
  }

  const currentTheme = htmlElement.getAttribute("data-bs-theme");
  if (currentTheme === "dark") {
    source.setAttribute("srcset", source.getAttribute("data-src-dark") || "");
  } else {
    const lightSrc = source.getAttribute("data-src-light");
    if (lightSrc) {
      source.setAttribute("srcset", lightSrc);
    }
  }
}

/**
 * Swap source[srcset] with source[data-src-dark] when the current theme is dark,
 * and restore the original light source when switching back.
 * Targets <source> elements with data-img-feature~="follow-theme".
 * Delegates to applyThemeBasedSource() for each matching element.
 */
export function applyAllThemeBasedSources(): void {
  try {
    document
      .querySelectorAll<HTMLSourceElement>(
        'source[data-img-feature~="follow-theme"]',
      )
      .forEach(applyThemeBasedSource);
  } catch (error) {
    console.error("Failed to apply theme-based sources:", error);
  }
}

/**
 * Apply the current theme's favicon to a single <link rel="icon"> element.
 * Swaps the href between light and dark variants using file-naming convention:
 * general.svg / general-dark.svg, general.png / general-dark.png.
 * @param link - The favicon link element to update.
 */
export function applyFaviconTheme(link: HTMLLinkElement): void {
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
  if (typeof prefersColorScheme.addEventListener === "function") {
    prefersColorScheme.addEventListener(
      "change",
      updateAutoThemeOnSystemChange,
    );
  } else if (
    typeof (
      prefersColorScheme as MediaQueryList & {
        addListener: (cb: () => void) => void;
      }
    ).addListener === "function"
  ) {
    (
      prefersColorScheme as MediaQueryList & {
        addListener: (cb: () => void) => void;
      }
    ).addListener(updateAutoThemeOnSystemChange);
  }
}

/**
 * Persist a theme choice and update all related UI elements.
 * The overlay from applyThemePreference naturally covers any in-progress
 * dropdown close animation, so no special deferral is needed.
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 */
export function setThemePreference(themeChoice: ThemeChoice): void {
  // Persist and update UI immediately for responsiveness.
  currentThemePreference = themeChoice;
  localStorage.setItem(StorageKey.Theme, themeChoice);
  applyThemePreference(themeChoice, false);
}
