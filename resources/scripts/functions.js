let currentLang = 'en';
let langData = {};

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

function updatePageText() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langData[key]) {
            el.textContent = langData[key];
        }
    });
}

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