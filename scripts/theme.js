const htmlElement = document.documentElement;

let currentThemePreference = 'auto';
const supportedThemes = ['auto', 'light', 'dark'];

function initThemePreference() {
    // Get preference if it exists
    const savedTheme = localStorage.getItem('bsTheme');
    if (supportedThemes.includes(savedTheme)) {
        currentThemePreference = savedTheme;
    }
}

const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');

function getSystemTheme() {
    return prefersColorScheme.matches ? 'dark' : 'light';
}

function applyThemePreference(themeChoice, save = true) {
    const theme = supportedThemes.includes(themeChoice) ? themeChoice : 'auto';
    currentThemePreference = theme;

    if (theme === 'auto') {
        htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    } else {
        htmlElement.setAttribute('data-bs-theme', theme);
    }

    if (save) {
        localStorage.setItem('bsTheme', theme);
    }

    applyThemeBasedImages();
}

function updateAutoThemeOnSystemChange() {
    if (currentThemePreference !== 'auto') {
        return;
    }

    htmlElement.setAttribute('data-bs-theme', getSystemTheme());
    applyThemeBasedImages();
}

function applyThemeBasedImages() {
    try {
        const currentTheme = htmlElement.getAttribute('data-bs-theme');
        document.querySelectorAll('img[data-src-dark]').forEach(img => {
            const darkSrc = img.getAttribute('data-src-dark');
            if (currentTheme === 'dark') {
                // Store the light src if not already stored, then switch to dark
                if (!img.hasAttribute('data-src-light')) {
                    img.setAttribute('data-src-light', img.getAttribute('src'));
                }
                img.setAttribute('src', darkSrc);
            } else {
                // Restore the light src if previously stored
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

function initSystemThemeListener() {
    if (typeof prefersColorScheme.addEventListener === 'function') {
        prefersColorScheme.addEventListener('change', updateAutoThemeOnSystemChange);
    } else if (typeof prefersColorScheme.addListener === 'function') {
        prefersColorScheme.addListener(updateAutoThemeOnSystemChange);
    }
}

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

function updateThemeToggleText() {
    const themeTextElements = document.querySelectorAll('.themeCurrentText');
    if (!themeTextElements || themeTextElements.length === 0) {
        return;
    }

    const key = getThemeI18nKey(currentThemePreference);
    themeTextElements.forEach(themeTextElement => {
        themeTextElement.setAttribute('data-i18n', key);
        themeTextElement.textContent = langData[key] || getThemeLabel(currentThemePreference);
    });
}

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

function setThemePreference(themeChoice) {
    applyThemePreference(themeChoice, true);
    updateThemeToggleText();
    setActiveThemeItem();
}
