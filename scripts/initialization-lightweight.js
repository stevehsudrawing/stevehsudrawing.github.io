document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('footer', '/sub-pages/footer-lightweight.html');

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

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    } catch (error) {
        console.error('Failed to initialize: ' + error);
    }
})