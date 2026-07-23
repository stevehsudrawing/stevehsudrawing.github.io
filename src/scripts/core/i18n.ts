/**
 * Internationalization (i18n) module.
 * Loads language-list and translation JSON files, updates page text,
 * manages the language selector UI, and persists the user's preference.
 */

import type { Lang } from '../../types/app.js';
import { StorageKey, AppEvent } from '../../types/app.js';

export interface LanguageItem {
    code: string;
    localizedName?: string;
}

export let supportedLangs: string[] = [];
export let languageList: LanguageItem[] = [];
export let currentLang: Lang = 'en';
export let langData: Record<string, string> = {};

/**
 * Determine and load the preferred language.
 * Priority: ?lang= URL parameter → localStorage → default 'en'.
 */
export async function initLang(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const savedLang = urlLang || localStorage.getItem(StorageKey.Lang) || 'en';
    await loadLang(savedLang);
}

/**
 * Normalize a language code to one of the site's supported languages.
 * Maps regional variants (zh-TW, zh-HK, etc.) to their canonical form,
 * and falls back to 'en' for any unrecognized code.
 * @param lang - The raw language code (e.g. 'zh-TW', 'en-US').
 * @returns The normalized language code ('en', 'zh-Hans', or 'zh-Hant').
 */
export function normalizeLang(lang: string): Lang {
    if (!lang || typeof lang !== 'string') return 'en';
    const lower = lang.toLowerCase();

    // Traditional Chinese: zh-HK, zh-MO, zh-TW, zh-Hant, and any zh-Hant-*
    if (lower === 'zh-hk' || lower === 'zh-mo' || lower === 'zh-tw' ||
        lower === 'zh-hant' || lower.indexOf('zh-hant-') === 0) {
        return 'zh-Hant';
    }

    // Simplified Chinese: zh-Hans, zh-CN, zh-SG, bare 'zh', and any zh-Hans-*
    if (lower === 'zh-hans' || lower === 'zh-cn' || lower === 'zh-sg' ||
        lower === 'zh' || lower.indexOf('zh-hans-') === 0) {
        return 'zh-Hans';
    }

    // Any other zh-* variant not covered above: default to Simplified Chinese
    if (lower.indexOf('zh') === 0) {
        return 'zh-Hans';
    }

    // English and any en-* variant
    if (lower === 'en' || lower.indexOf('en-') === 0) {
        return 'en';
    }

    // All other codes: fall back to English
    return 'en';
}

/**
 * Safely retrieve a translated string from the global langData dictionary.
 * If langData is loaded and contains the given key, the translated value is returned;
 * otherwise the fallback text is returned.
 * @param key - The i18n key to look up (e.g. 'text-welcome').
 * @param fallback - Text to return when the key is not found.
 * @returns The translated text, or the fallback if unavailable.
 */
export function translate(key: string, fallback?: string): string {
    if (typeof langData !== 'undefined' && langData[key]) {
        return langData[key];
    }
    return fallback !== undefined ? fallback : '';
}

/**
 * Fetch the list of supported languages from /configs/language-list.json.
 * Falls back to ['en', 'zh-Hans', 'zh-Hant'] on error.
 */
export async function loadSupportedLangs(): Promise<void> {
    try {
        const response = await fetch('/configs/language-list.json');
        if (!response.ok) throw new Error(`Failed to load language list: ${response.status}`);
        const list: LanguageItem[] = await response.json();
        if (Array.isArray(list)) {
            languageList = list;
            supportedLangs = list.map(item => item?.code).filter(Boolean) as string[];
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
 * Dispatches a 'pageTextUpdated' event afterward so other modules
 * (e.g. tooltips) can react to the text change.
 */
export function updatePageText(): void {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = translate(key!);
        if (translated) {
            el.textContent = translated;
        } else {
            console.log('Missing key:', key);
        }
    });

    // Translate HTML-capable elements: [data-i18n-html] uses innerHTML
    // so the translation string may contain inline markup (e.g. <cite>).
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
        const key = el.getAttribute('data-i18n-html');
        const translated = translate(key!);
        if (translated) {
            el.innerHTML = translated;
        } else {
            console.log('Missing key:', key);
        }
    });

    // Translate img alt attributes: elements with data-i18n-alt
    // use it to specify the translation key,
    // and the translated text is written to the alt attribute.
    document.querySelectorAll('img[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        const translated = translate(key!);
        if (translated) {
            el.setAttribute('alt', translated);
        } else {
            console.log('Missing key:', key);
        }
    });

    // Translate aria-label attributes: elements with data-i18n-aria-label
    // use it to specify the translation key,
    // and the translated text is written to the aria-label attribute.
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria-label');
        const translated = translate(key!);
        if (translated) {
            el.setAttribute('aria-label', translated);
        } else {
            console.log('Missing key:', key);
        }
    });

    // Notify other modules that page text has been updated
    document.dispatchEvent(new CustomEvent(AppEvent.PageTextUpdated));
}

/**
 * Highlight the active language item in the language switcher dropdown.
 */
export function setActiveLangItem(): void {
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
        });
    } catch (error) {
        console.error('Failed to activate language item:', error);
    }
}

/**
 * Fetch the JSON translation file for a given language code,
 * store it in langData, update all page text, persist the preference,
 * and sync UI elements (lang attribute, dropdown, select).
 * @param lang - The language code to load (e.g. 'en', 'zh-Hans').
 */
export async function loadLang(rawLang: string): Promise<void> {
    // Normalize the language code before loading
    const lang: Lang = normalizeLang(rawLang);

    try {
        const response = await fetch(`/configs/i18n/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load file of language ${lang}`);
        langData = await response.json();
        currentLang = lang;

        updatePageText();
        // Save preference
        localStorage.setItem(StorageKey.Lang, lang);
        // Update URL query parameter without reloading
        const url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        history.replaceState(null, '', url);
        // Update 'lang' element
        document.documentElement.lang = lang;

        const { setActiveNavItem } = await import('../ui/navbar.js');
        setActiveNavItem();
        setActiveLangItem();
        const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
        if (languageSelect) {
            languageSelect.value = currentLang;
        }

        const { updatePageTitle } = await import('../ui/page-title.js');
        updatePageTitle();
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

/**
 * Populate both the header language dropdown menu and the settings modal
 * language select with items from the loaded language list.
 */
export function populateLanguageMenus(): void {
    // Populate header language menu
    try {
        const langToggle = document.getElementById('lang-dropdown');
        const langMenu = langToggle ? langToggle.parentElement?.querySelector('.dropdown-menu') : null;
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
        const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
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
