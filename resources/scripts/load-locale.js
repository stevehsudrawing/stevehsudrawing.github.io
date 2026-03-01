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

// Load i18n file
async function loadLang(lang) {
    try {
        const response = await fetch(`https://stevehsudrawing.github.io/resources/locales/${lang}.json`);
        if (!response.ok) throw new Error(`Failed to load file of language ${lang}`);
        langData = await response.json();
        currentLang = lang;
        updatePageText();
        // Save preference
        localStorage.setItem('preferredLang', lang);
        // Update 'lang' element
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    } catch (error) {
        console.error('Failed to load language file:', error);
    }
}

function toggleLang() {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    loadLang(newLang);
}