document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', 'sub-pages/header.html');
        await loadHTML('footer', 'sub-pages/footer.html');
        await loadHTML('qrCodeModalContainer', 'sub-pages/qr-code-modal.html');
        await loadHTML('settingsModalContainer', 'sub-pages/settings-modal.html');

        // Load supported languages and populate UI
        await loadSupportedLangs();

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

        initializeSettingsModal();

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        document.addEventListener('click', function (e) {
            const langItem = e.target.closest('[data-lang]');
            if (langItem) {
                e.preventDefault();
                const selectedLang = langItem.getAttribute('data-lang');
                loadLang(selectedLang);
                return;
            }

            const themeItem = e.target.closest('.theme-item');
            if (themeItem) {
                e.preventDefault();
                const selectedTheme = themeItem.getAttribute('data-theme');
                setThemePreference(selectedTheme);
            }
        });

        updateThemeToggleText();
        setActiveThemeItem();

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    } catch (error) {
        console.error('Failed to initialize: ' + error);
    }
})