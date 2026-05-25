function loadHTML(elementId, filePath) {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status}`);
            }
            const htmlContent = await response.text();
            const placeholder = document.getElementById(elementId);
            if (!placeholder) {
                throw new Error(`Cannot find ${elementId} element.`);
            }
            placeholder.innerHTML = htmlContent;
            resolve();
        } catch (error) {
            console.error('Failed to load:', error);
            const placeholder = document.getElementById(elementId);
            if (placeholder) {
                placeholder.innerHTML = '<div class="alert alert-warning">Failed to load "' + elementId + '"</div>';
            }
            reject(error);
        }
    })
}

const htmlElement = document.documentElement;

// Activate Nav Item
function setActiveNavItem() {
    try {
        const currentPath = window.location.pathname;
        let currentPage = currentPath === '/' ? '/' : currentPath;
        if (currentPage === '/') currentPage = '/index.html';

        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        if (navLinks.length === 0) {
            console.warn('Cannot find navbar links!');
            return;
        }

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    } catch (error) {
        console.error('Failed to activate nav item: ', error);
    }
}

// ========== Language-Related ==========

let supportedLangs = ['en', 'zh-Hans', 'zh-Hant'];
let currentLang = 'en';
let langData = {};

function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[key]) {
            el.textContent = langData[key];
        }
    });
}

function setActiveLangItem() {
    try {
        const langItems = document.querySelectorAll('.lang-item');
        if (langItems.length === 0) {
            console.warn('Cannot find language items!');
            return;
        }

        langItems.forEach(item => {
            const itemDataLang = item.getAttribute('data-lang');
            if (itemDataLang === currentLang) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'true');
            } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            }
        })
    } catch (error) {
        console.error('Failed to activate language item:', error);
    }
}

async function loadLang(lang) {
    try {
        const response = await fetch(`/locales/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load file of language ${lang}`);
        langData = await response.json();
        currentLang = lang;

        // Font update
        for (i in supportedLangs) {
            document.documentElement.classList.remove(`lang-${supportedLangs[i]}`);
        }
        document.documentElement.classList.add(`lang-${lang}`);

        updatePageText();
        // Save preference
        localStorage.setItem('preferredLang', lang);
        // Update 'lang' element
        document.documentElement.lang = lang;

        setActiveNavItem();
        setActiveLangItem();
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

// ========== Theme-Related ==========

let currentThemePreference = 'auto';
const supportedThemes = ['auto', 'light', 'dark'];

// Get preference if it exists
const savedTheme = localStorage.getItem('bsTheme');
if (supportedThemes.includes(savedTheme)) {
    currentThemePreference = savedTheme;
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
}

function updateAutoThemeOnSystemChange() {
    if (currentThemePreference !== 'auto') {
        return;
    }

    htmlElement.setAttribute('data-bs-theme', getSystemTheme());
}

if (typeof prefersColorScheme.addEventListener === 'function') {
    prefersColorScheme.addEventListener('change', updateAutoThemeOnSystemChange);
} else if (typeof prefersColorScheme.addListener === 'function') {
    prefersColorScheme.addListener(updateAutoThemeOnSystemChange);
}

function getThemeI18nKey(theme) {
    switch (theme) {
        case 'light':
            return 'textLight';
        case 'dark':
            return 'textDark';
        default:
            return 'textAuto';
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

applyThemePreference(currentThemePreference, false);

// ========== QR Code Modal ==========

function showQRCodeModal(linkUrl) {
    const modalTitle = document.getElementById('qrCodeModalTitle');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const modalElement = document.getElementById('qrCodeModal');

    if (!modalTitle || !qrCodeContainer || !modalElement) {
        console.warn('QR code modal elements not found.');
        return;
    }

    modalTitle.textContent = linkUrl;
    qrCodeContainer.innerHTML = '';

    const computedStyles = getComputedStyle(htmlElement);
    const colorDark = computedStyles.getPropertyValue('--bs-body-color').trim() || '#000000';
    const colorLight = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';

    new QRCode(qrCodeContainer, {
        text: linkUrl,
        width: 232,
        height: 232,
        colorDark,
        colorLight,
        correctLevel: QRCode.CorrectLevel.L
    });

    const bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}
