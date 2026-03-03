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

// Activate Nav Item
function setActiveNavItem() {
    try {
        const currentPath = window.location.pathname;
        let currentPage = currentPath === '/' ? '/' : currentPath;
        if (currentPage === '/index.html') currentPage = '/';
        currentPage = "https://stevehsudrawing.github.io" + currentPage;

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
        const response = await fetch(`https://stevehsudrawing.github.io/resources/locales/${lang}.json`);
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

const htmlElement = document.documentElement;

// Get preference if it exists
const savedTheme = localStorage.getItem('bsTheme');
if (savedTheme) {
    htmlElement.setAttribute('data-bs-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';

    htmlElement.setAttribute('data-bs-theme', newTheme);
    // Save preference
    localStorage.setItem('bsTheme', newTheme);
}
