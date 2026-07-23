/**
 * Theme management module.
 * Supports light, dark, and auto (follow system) themes using Bootstrap's
 * data-bs-theme attribute. Handles persistence, system preference listening,
 * theme-aware image swapping, and UI toggle synchronization.
 */

import type { ThemeChoice, EffectiveTheme } from '../../types/app.js';
import { StorageKey } from '../../types/app.js';
import { translate } from '../core/i18n.js';
import { initImageLoadingOpacity, markImageUnloaded } from '../core/img-utils.js';

export const htmlElement: HTMLElement = document.documentElement;

export let currentThemePreference: ThemeChoice = 'auto';
export const supportedThemes = ['auto', 'light', 'dark'] as const;

/** Monotonic counter to cancel superseded transition callbacks. */
export let themeTransitionId = 0;

/**
 * Restore the saved theme preference from localStorage, defaulting to 'auto'.
 */
export function initThemePreference(): void {
    // Get preference if it exists
    const savedTheme = localStorage.getItem(StorageKey.Theme);
    if (savedTheme && (supportedThemes as readonly string[]).includes(savedTheme)) {
        currentThemePreference = savedTheme as ThemeChoice;
    }
}

export const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Query the OS-level color scheme preference.
 * @returns The current system theme.
 */
export function getSystemTheme(): EffectiveTheme {
    return prefersColorScheme.matches ? 'dark' : 'light';
}

/**
 * Resolve a theme choice to the effective 'light' or 'dark' value
 * that will be applied to data-bs-theme.
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @returns The effective theme.
 */
export function getEffectiveTheme(themeChoice: ThemeChoice): EffectiveTheme {
    if (themeChoice === 'auto') return getSystemTheme();
    return themeChoice as EffectiveTheme;
}

/**
 * Initialize the theme transition overlay's transitionend listener.
 * Must be called after header.html has been loaded into the DOM.
 */
export function initThemeTransitionOverlay(): void {
    const overlay = document.querySelector('.theme-transition-overlay');
    if (!overlay) return;

    // Clean up fade-out class after the fade-out transition ends,
    // so the overlay is ready for the next use.
    overlay.addEventListener('transitionend', function (e: Event) {
        const te = e as TransitionEvent;
        if (te.propertyName === 'opacity' && overlay.classList.contains('fade-out')) {
            overlay.classList.remove('fade-out');
        }
    });
}

/**
 * Apply the raw theme change (data-bs-theme + images) immediately.
 * Callers are responsible for overlay timing if a visual transition is desired.
 * @param theme - The resolved theme value ('light', 'dark', or 'auto').
 */
export function applyThemeChange(theme: string): void {
    if (theme === 'auto') {
        htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    } else {
        htmlElement.setAttribute('data-bs-theme', theme);
    }
    applyAllThemeBasedImages();
    applyAllFaviconThemes();
}

/**
 * Apply a theme choice to the page. When 'auto', defer to the system theme.
 * Uses a full-page overlay crossfade for smooth visual transition.
 * Skips the overlay for users who prefer reduced motion.
 * @param themeChoice - One of 'auto', 'light', or 'dark'.
 * @param save - Whether to persist the choice to localStorage.
 */
export function applyThemePreference(themeChoice: ThemeChoice, save = true): void {
    const theme: ThemeChoice = (supportedThemes as readonly string[]).includes(themeChoice) ? themeChoice : 'auto';

    if (save) {
        localStorage.setItem(StorageKey.Theme, theme);
    }

    const overlay = document.querySelector('.theme-transition-overlay');

    // Skip the overlay (instant switch) when:
    // - User prefers reduced motion, or
    // - The effective theme does not actually change, or
    // - The overlay is not yet in the DOM (initial load from <head>).
    const skipOverlay =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        htmlElement.getAttribute('data-bs-theme') === getEffectiveTheme(theme) ||
        !overlay;

    if (skipOverlay) {
        applyThemeChange(theme);
        return;
    }

    // Increment ID to cancel any pending callback from rapid toggling.
    const thisId = ++themeTransitionId;

    // Phase 1: Fade in the overlay over ~500 ms.
    overlay.classList.add('active');
    overlay.classList.remove('fade-out');

    // Phase 2: After fade-in completes, switch theme behind the opaque overlay.
    setTimeout(function () {
        if (thisId !== themeTransitionId) return; // Superseded

        applyThemeChange(theme);

        // Phase 3: Fade out the overlay to reveal the new theme.
        overlay.classList.remove('active');
        overlay.classList.add('fade-out');
    }, 500);
}

/**
 * Called when the system color scheme changes. If the user has chosen 'auto',
 * update the data-bs-theme attribute and refresh theme-based images.
 * No overlay is used — system-initiated changes should be subtle.
 */
export function updateAutoThemeOnSystemChange(): void {
    if (currentThemePreference !== 'auto') return;
    applyThemeChange('auto');
}

/**
 * Apply the current theme's image source to a single <img> element
 * that has data-img-feature~="follow-theme".
 * Ensures data-src-light is populated on first call so the light
 * source is always recoverable.
 * @param img - The image element to update.
 */
export function applyThemeBasedImage(img: HTMLImageElement): void {
    if (!img.hasAttribute('data-src-light')) {
        img.setAttribute('data-src-light', img.getAttribute('src') || '');
    }

    // Remove loaded marker so the image appears semi-transparent while
    // the new theme variant loads (see img-utils.js loading opacity).
    markImageUnloaded(img);

    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    if (currentTheme === 'dark') {
        img.setAttribute('src', img.getAttribute('data-src-dark') || '');
    } else {
        const lightSrc = img.getAttribute('data-src-light');
        if (lightSrc) {
            img.setAttribute('src', lightSrc);
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
        document.querySelectorAll<HTMLImageElement>('img[data-img-feature~="follow-theme"]')
            .forEach(applyThemeBasedImage);
    } catch (error) {
        console.error('Failed to apply theme-based images:', error);
    }
}

/**
 * Apply the current theme's favicon to a single <link rel="icon"> element.
 * Swaps the href between light and dark variants using file-naming convention:
 * general.svg / general-dark.svg, general.png / general-dark.png.
 * @param link - The favicon link element to update.
 */
export function applyFaviconTheme(link: HTMLLinkElement): void {
    const href = link.getAttribute('href');
    if (!href) return;

    const currentTheme = htmlElement.getAttribute('data-bs-theme');

    if (currentTheme === 'dark') {
        // Switch to dark variant: general.ext -> general-dark.ext
        const darkHref = href.replace(/general(?=\.[a-z]+$)/, 'general-dark');
        if (darkHref !== href) {
            link.setAttribute('href', darkHref);
        }
    } else {
        // Switch to light variant: general-dark.ext -> general.ext
        const lightHref = href.replace(/general-dark(?=\.[a-z]+$)/, 'general');
        if (lightHref !== href) {
            link.setAttribute('href', lightHref);
        }
    }
}

/**
 * Update all favicon <link> elements to match the current theme.
 * Delegates to applyFaviconTheme() for each matching element.
 */
export function applyAllFaviconThemes(): void {
    try {
        document.querySelectorAll<HTMLLinkElement>('link[rel="icon"]').forEach(applyFaviconTheme);
    } catch (error) {
        console.error('Failed to apply favicon themes:', error);
    }
}

/**
 * Listen for OS-level color scheme changes and re-apply the theme
 * when the user's preference is 'auto'.
 */
export function initSystemThemeListener(): void {
    if (typeof prefersColorScheme.addEventListener === 'function') {
        prefersColorScheme.addEventListener('change', updateAutoThemeOnSystemChange);
    } else if (typeof (prefersColorScheme as MediaQueryList & { addListener: (cb: () => void) => void }).addListener === 'function') {
        (prefersColorScheme as MediaQueryList & { addListener: (cb: () => void) => void }).addListener(updateAutoThemeOnSystemChange);
    }
}

/**
 * Theme metadata: i18n keys and English labels.
 */
export const THEME_META = {
    'light': { i18n: 'text-light' as const, label: 'Light' },
    'dark':  { i18n: 'text-dark' as const,  label: 'Dark' },
    'auto':  { i18n: 'text-auto' as const,  label: 'Auto' },
} as const satisfies Record<ThemeChoice, { i18n: string; label: string }>;

/**
 * Map a theme value to its i18n key for display in the theme toggle.
 * @param theme - One of 'auto', 'light', or 'dark'.
 * @returns The i18n key (e.g. 'text-auto').
 */
export function getThemeI18nKey(theme: ThemeChoice): string {
    return (THEME_META[theme] || THEME_META['auto']).i18n;
}

/**
 * Return a human-readable English label for a theme value.
 * @param theme - One of 'auto', 'light', or 'dark'.
 * @returns The label (e.g. 'Auto').
 */
export function getThemeLabel(theme: ThemeChoice): string {
    return (THEME_META[theme] || THEME_META['auto']).label;
}

/**
 * Update all .themeCurrentText elements to display the current theme name.
 */
export function updateThemeToggleText(): void {
    const themeTextElements = document.querySelectorAll('.themeCurrentText');
    if (themeTextElements.length === 0) {
        return;
    }

    const key = getThemeI18nKey(currentThemePreference);
    themeTextElements.forEach(themeTextElement => {
        themeTextElement.setAttribute('data-i18n', key);
        themeTextElement.textContent = translate(key) || getThemeLabel(currentThemePreference);
    });
}

/**
 * Mark the currently selected theme item as active in the theme dropdown.
 */
export function setActiveThemeItem(): void {
    const themeItems = document.querySelectorAll('.theme-item');
    themeItems.forEach(item => {
        const itemTheme = item.getAttribute('data-theme');
        if (itemTheme === currentThemePreference) {
            item.classList.add('active');
            item.setAttribute('aria-current', 'true');
        } else {
            item.classList.remove('active');
            item.removeAttribute('aria-current');
        }
    });
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
    updateThemeToggleText();
    setActiveThemeItem();
    applyThemePreference(themeChoice, false);
}
