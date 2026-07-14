/**
 * Theme management module.
 * Supports light, dark, and auto (follow system) themes using Bootstrap's
 * data-bs-theme attribute. Handles persistence, system preference listening,
 * theme-aware image swapping, and UI toggle synchronization.
 */

const htmlElement = document.documentElement;

let currentThemePreference = 'auto';
const supportedThemes = ['auto', 'light', 'dark'];

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
 * Apply a theme choice to the page. When 'auto', defer to the system theme.
 * @param {string} themeChoice - One of 'auto', 'light', or 'dark'.
 * @param {boolean} [save=true] - Whether to persist the choice to localStorage.
 */
function applyThemePreference(themeChoice, save = true) {
    const theme = supportedThemes.includes(themeChoice) ? themeChoice : 'auto';
    currentThemePreference = theme;

    // Temporarily disable all transitions to prevent cascading transition
    // flicker when CSS custom properties change during theme switch.
    htmlElement.classList.add('disable-transitions');

    if (theme === 'auto') {
        htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    } else {
        htmlElement.setAttribute('data-bs-theme', theme);
    }

    if (save) {
        localStorage.setItem('bsTheme', theme);
    }

    applyThemeBasedImages();

    // Re-enable transitions after the current frame settles.
    requestAnimationFrame(function () {
        htmlElement.classList.remove('disable-transitions');
    });
}

/**
 * Called when the system color scheme changes. If the user has chosen 'auto',
 * update the data-bs-theme attribute and refresh theme-based images.
 */
function updateAutoThemeOnSystemChange() {
    if (currentThemePreference !== 'auto') {
        return;
    }

    // Temporarily disable all transitions to prevent cascading transition flicker.
    htmlElement.classList.add('disable-transitions');

    htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    applyThemeBasedImages();

    // Re-enable transitions after the current frame settles.
    requestAnimationFrame(function () {
        htmlElement.classList.remove('disable-transitions');
    });
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
 * Map a theme value to its i18n key for display in the theme toggle.
 * @param {string} theme - One of 'auto', 'light', or 'dark'.
 * @returns {string} The i18n key (e.g. 'text-auto').
 */
function getThemeI18nKey(theme) {
    switch (theme) {
        case 'light':
            return 'text-light';
        case 'dark':
            return 'text-dark';
        default:
            return 'text-auto';
    }
}

/**
 * Return a human-readable English label for a theme value.
 * @param {string} theme - One of 'auto', 'light', or 'dark'.
 * @returns {string} The label (e.g. 'Auto').
 */
function getThemeLabel(theme) {
    switch (theme) {
        case 'light':
            return 'Light';
        case 'dark':
            return 'Dark';
        default:
            return 'Auto';
    }
}

/**
 * Update all .themeCurrentText elements to display the current theme name.
 */
function updateThemeToggleText() {
    const themeTextElements = document.querySelectorAll('.themeCurrentText');
    if (!themeTextElements || themeTextElements.length === 0) {
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
 * When a dropdown menu is mid-close, the actual theme application is
 * deferred to avoid disable-transitions from killing the close animation.
 * @param {string} themeChoice - One of 'auto', 'light', or 'dark'.
 */
function setThemePreference(themeChoice) {
    // Persist and update UI immediately for responsiveness.
    currentThemePreference = themeChoice;
    localStorage.setItem('bsTheme', themeChoice);
    updateThemeToggleText();
    setActiveThemeItem();

    // Check if a dropdown menu is currently playing its close animation.
    // If so, defer the theme application so disable-transitions does not
    // kill the dropdown's opacity/transform transition.
    var closingMenu = document.querySelector('.dropdown-menu.closing');
    if (closingMenu) {
        // The close animation takes ~180 ms plus cleanup; 250 ms is safe.
        setTimeout(function () {
            applyThemePreference(themeChoice, false);
        }, 250);
    } else {
        applyThemePreference(themeChoice, false);
    }
}

