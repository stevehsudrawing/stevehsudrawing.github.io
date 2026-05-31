// Accessibility: show `#skipButton` only when navigation is via keyboard
(function () {
    const root = document.documentElement;

    function setKeyboardMode() {
        root.classList.add('user-input-keyboard');
        root.classList.remove('user-input-pointer');
    }

    function setPointerMode() {
        root.classList.remove('user-input-keyboard');
        root.classList.add('user-input-pointer');
    }

    // Keyboard navigation (Tab) should enable keyboard mode
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setKeyboardMode();
        }
    }, true);

    // Any pointer interaction disables keyboard-only display
    ['mousedown', 'pointerdown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, setPointerMode, true);
    });

    // Optional: on focus of skip button ensure keyboard class present for older browsers
    document.addEventListener('focusin', function (e) {
        if (e.target && e.target.id === 'skipButton') {
            // If focus landed on the skip button but pointer mode is active, switch to keyboard mode
            if (!root.classList.contains('user-input-keyboard')) {
                // Prefer :focus-visible in modern browsers; this is a safe fallback
                setKeyboardMode();
            }
        }
    });
})();

document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', '/sub-pages/header.html');
        initializeDropdownMenuAnimation();
        await loadHTML('footer', '/sub-pages/footer.html');
        await loadHTML('qrCodeModalContainer', '/sub-pages/qr-code-modal.html');
        await loadHTML('settingsModalContainer', '/sub-pages/settings-modal.html');

        // Load supported languages and populate UI
        await loadSupportedLangs();

        applyThemePreference(currentThemePreference, false);

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

        addEventListenerToTitleLinkAnchors()

    } catch (error) {
        console.error('Failed to initialize: ' + error);
    }
})