document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('footer', '/sub-pages/footer-lightweight.html');

        applyThemePreference(currentThemePreference, false);

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        addSettingEventListeners();

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    } catch (error) {
        console.error('Failed to initialize: ' + error);
    }
})