document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', 'sub-pages/header.html');
        await loadHTML('footer', 'sub-pages/footer.html');
        await loadHTML('qrCodeModalContainer', 'sub-pages/qr-code-modal.html');

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        loadLang(savedLang);

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