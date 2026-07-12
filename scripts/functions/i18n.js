/**
 * Internationalization (i18n) module.
 * Loads language-list and translation JSON files, updates page text,
 * manages the language selector UI, and persists the user's preference.
 */

let supportedLangs = [];
let languageList = [];
let currentLang = 'en';
let langData = {};

/**
 * Fetch the list of supported languages from /configs/language-list.json.
 * Falls back to ['en', 'zh-Hans', 'zh-Hant'] on error.
 * @returns {Promise<void>}
 */
async function loadSupportedLangs() {
    try {
        const response = await fetch('/configs/language-list.json');
        if (!response.ok) throw new Error(`Failed to load language list: ${response.status}`);
        const list = await response.json();
        if (Array.isArray(list)) {
            languageList = list;
            supportedLangs = list.map(item => item && item.code).filter(Boolean);
        } else {
            languageList = [];
            supportedLangs = [];
        }
    } catch (error) {
        console.error('Failed to load language list:', error);
        supportedLangs = ['en', 'zh-Hans', 'zh-Hant'];
    }
}


/**
 * Walk the DOM and replace text content of all [data-i18n] elements
 * using the currently loaded langData dictionary.
 * Also recreates Bootstrap tooltips whose titles are translated.
 */
function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[key]) {
            el.textContent = langData[key];
        } else {
            console.log('Missing key:', key);
        }
    });

    // Translate Bootstrap tooltips: elements with data-bs-toggle="tooltip"
    // use data-i18n-tooltip to specify the translation key,
    // and the translated text is written to data-bs-title.
    // If a tooltip instance already exists (e.g. after language switch),
    // dispose and recreate it so it picks up the new title.
    document.querySelectorAll('[data-bs-toggle="tooltip"][data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        if (langData[key]) {
            el.setAttribute('data-bs-title', langData[key]);
            const tooltipInstance = bootstrap.Tooltip.getInstance(el);
            if (tooltipInstance) {
                tooltipInstance.dispose();
                new bootstrap.Tooltip(el);
            }
        }
    });

    // Translate img alt attributes: elements with data-i18n-alt
    // use it to specify the translation key,
    // and the translated text is written to the alt attribute.
    document.querySelectorAll('img[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (langData[key]) {
            el.setAttribute('alt', langData[key]);
        } else {
            console.log('Missing key:', key);
        }
    });
}

/**
 * Highlight the active language item in the language switcher dropdown.
 */
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

/**
 * Fetch the JSON translation file for a given language code,
 * store it in langData, update all page text, persist the preference,
 * and sync UI elements (lang attribute, dropdown, select).
 * @param {string} lang - The language code to load (e.g. 'en', 'zh-Hans').
 * @returns {Promise<void>}
 */
async function loadLang(lang) {
    try {
        const response = await fetch(`/configs/i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load file of language ${lang}`);
        langData = await response.json();
        currentLang = lang;

        updatePageText();
        // Save preference
        localStorage.setItem('preferredLang', lang);
        // Update 'lang' element
        document.documentElement.lang = lang;

        setActiveNavItem();
        setActiveLangItem();
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = currentLang;
        }

        updatePageTitle();
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

/**
 * Populate both the header language dropdown menu and the settings modal
 * language select with items from the loaded language list.
 */
function populateLanguageMenus() {
    // Populate header language menu
    try {
        const langToggle = document.getElementById('lang-dropdown');
        const langMenu = langToggle ? (langToggle.parentElement && langToggle.parentElement.querySelector('.dropdown-menu')) : null;
        if (langMenu) {
            langMenu.innerHTML = '';
            if (Array.isArray(languageList) && languageList.length > 0) {
                languageList.forEach(item => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item lang-item';
                    a.href = '#';
                    a.setAttribute('data-lang', item.code);
                    a.textContent = item.localizedName || item.code;
                    li.appendChild(a);
                    langMenu.appendChild(li);
                });
            } else if (Array.isArray(supportedLangs)) {
                supportedLangs.forEach(code => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item lang-item';
                    a.href = '#';
                    a.setAttribute('data-lang', code);
                    a.textContent = code;
                    li.appendChild(a);
                    langMenu.appendChild(li);
                });
            }
        }
    } catch (e) {
        console.warn('Failed to populate header language menu:', e);
    }

    // Populate settings modal select
    try {
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.innerHTML = '';
            if (Array.isArray(languageList) && languageList.length > 0) {
                languageList.forEach(item => {
                    const opt = document.createElement('option');
                    opt.value = item.code;
                    opt.textContent = item.localizedName || item.code;
                    languageSelect.appendChild(opt);
                });
            } else if (Array.isArray(supportedLangs)) {
                supportedLangs.forEach(code => {
                    const opt = document.createElement('option');
                    opt.value = code;
                    opt.textContent = code;
                    languageSelect.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.warn('Failed to populate settings language select:', e);
    }
}