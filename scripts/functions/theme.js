/**
 * Theme management module.
 * Supports light, dark, and auto (follow system) themes using Bootstrap's
 * data-bs-theme attribute. Handles persistence, system preference listening,
 * theme-aware image swapping, and UI toggle synchronization.
 */

const htmlElement = document.documentElement;

let currentThemePreference = 'auto';
const supportedThemes = ['auto', 'light', 'dark'];

/** @type {number} Monotonic counter to cancel superseded transition callbacks. */
var themeTransitionId = 0;

/**
 * Restore the saved theme preference from localStorage, defaulting to 'auto'.
 */
function initThemePreference() {
    // Get preference if it exists
    const savedTheme = localStorage.getItem('bsTheme');
    if (supportedThemes.includes(savedTheme)) {
        currentThemePreference = savedTheme;
    }
}

const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

/**
 * Query the OS-level color scheme preference.
 * @returns {'light'|'dark'} The current system theme.
 */
function getSystemTheme() {
    return prefersColorScheme.matches ? 'dark' : 'light';
}

/**
 * Resolve a theme choice to the effective 'light' or 'dark' value
 * that will be applied to data-bs-theme.
 * @param {string} themeChoice - One of 'auto', 'light', or 'dark'.
 * @returns {'light'|'dark'} The effective theme.
 */
function getEffectiveTheme(themeChoice) {
    if (themeChoice === 'auto') return getSystemTheme();
    return themeChoice;
}

/**
 * Initialize the theme transition overlay's transitionend listener.
 * Must be called after header.html has been loaded into the DOM.
 */
function initThemeTransitionOverlay() {
    var overlay = document.querySelector('.theme-transition-overlay');
    if (!overlay) return;

    // Clean up fade-out class after the fade-out transition ends,
    // so the overlay is ready for the next use.
    overlay.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'opacity' && overlay.classList.contains('fade-out')) {
            overlay.classList.remove('fade-out');
        }
    });
}

/**
 * Apply the raw theme change (data-bs-theme + images) immediately.
 * Callers are responsible for overlay timing if a visual transition is desired.
 * @param {string} theme - The resolved theme value ('light', 'dark', or 'auto').
 */
function applyThemeChange(theme) {
    if (theme === 'auto') {
        htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    } else {
        htmlElement.setAttribute('data-bs-theme', theme);
    }
    applyThemeBasedImages();
}

/**
 * Apply a theme choice to the page. When 'auto', defer to the system theme.
 * Uses a full-page overlay crossfade for smooth visual transition.
 * Skips the overlay for users who prefer reduced motion.
 * @param {string} themeChoice - One of 'auto', 'light', or 'dark'.
 * @param {boolean} [save=true] - Whether to persist the choice to localStorage.
 */
function applyThemePreference(themeChoice, save = true) {
    const theme = supportedThemes.includes(themeChoice) ? themeChoice : 'auto';

    if (save) {
        localStorage.setItem('bsTheme', theme);
    }

    var overlay = document.querySelector('.theme-transition-overlay');

    // Skip the overlay (instant switch) when:
    // - User prefers reduced motion, or
    // - The effective theme does not actually change, or
    // - The overlay is not yet in the DOM (initial load from <head>).
    var skipOverlay =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        htmlElement.getAttribute('data-bs-theme') === getEffectiveTheme(theme) ||
        !overlay;

    if (skipOverlay) {
        applyThemeChange(theme);
        return;
    }

    // Increment ID to cancel any pending callback from rapid toggling.
    var thisId = ++themeTransitionId;

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
function updateAutoThemeOnSystemChange() {
    if (currentThemePreference !== 'auto') return;
    applyThemeChange('auto');
}

/**
 * Swap img[src] with img[data-src-dark] when the current theme is dark,
 * and restore the original light source when switching back.
 * Targets <img> elements with data-img-feature~="follow-theme".
 */
function applyThemeBasedImages() {
    try {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        document.querySelectorAll('img[data-img-feature~="follow-theme"]').forEach(img => {
            // Ensure data-src-light is populated for robustness regardless
            // of the current theme, so the light src is always recoverable.
            if (!img.hasAttribute('data-src-light')) {
                img.setAttribute('data-src-light', img.getAttribute('src'));
            }

            const darkSrc = img.getAttribute('data-src-dark');
            if (currentTheme === 'dark') {
                img.setAttribute('src', darkSrc);
            } else {
                const lightSrc = img.getAttribute('data-src-light');
                if (lightSrc) {
                    img.setAttribute('src', lightSrc);
                }
            }
        });
    } catch (error) {
        console.error('Failed to apply theme-based images:', error);
    }
}

/**
 * Listen for OS-level color scheme changes and re-apply the theme
 * when the user's preference is 'auto'.
 */
function initSystemThemeListener() {
    if (typeof prefersColorScheme.addEventListener === 'function') {
        prefersColorScheme.addEventListener('change', updateAutoThemeOnSystemChange);
    } else if (typeof prefersColorScheme.addListener === 'function') {
        prefersColorScheme.addListener(updateAutoThemeOnSystemChange);
    }
}

/**
 * Theme metadata: i18n keys and English labels.
 * @type {Object<string, {i18n: string, label: string}>}
 */
var THEME_META = {
    'light': { i18n: 'text-light', label: 'Light' },
    'dark':  { i18n: 'text-dark',  label: 'Dark' },
    'auto':  { i18n: 'text-auto',  label: 'Auto' }
};

/**
 * Map a theme value to its i18n key for display in the theme toggle.
 * @param {string} theme - One of 'auto', 'light', or 'dark'.
 * @returns {string} The i18n key (e.g. 'text-auto').
 */
function getThemeI18nKey(theme) {
    return (THEME_META[theme] || THEME_META['auto']).i18n;
}

/**
 * Return a human-readable English label for a theme value.
 * @param {string} theme - One of 'auto', 'light', or 'dark'.
 * @returns {string} The label (e.g. 'Auto').
 */
function getThemeLabel(theme) {
    return (THEME_META[theme] || THEME_META['auto']).label;
}

/**
 * Update all .themeCurrentText elements to display the current theme name.
 */
function updateThemeToggleText() {
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
function setActiveThemeItem() {
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
 * @param {string} themeChoice - One of 'auto', 'light', or 'dark'.
 */
function setThemePreference(themeChoice) {
    // Persist and update UI immediately for responsiveness.
    currentThemePreference = themeChoice;
    localStorage.setItem('bsTheme', themeChoice);
    updateThemeToggleText();
    setActiveThemeItem();
    applyThemePreference(themeChoice, false);
}