let supportedLangs = [];
let languageList = [];
let currentLang = 'en';
let langData = {};

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
        const response = await fetch(`/configs/i18n/${lang}.json`);
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
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = currentLang;
        }
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

function populateLanguageMenus() {
    // Populate header language menu
    try {
        const langToggle = document.getElementById('langDropdown');
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
        const languageSelect = document.getElementById('languageSelect');
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