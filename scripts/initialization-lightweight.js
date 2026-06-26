// Immediate initialization (no DOM required)
initThemePreference();
initSystemThemeListener();

document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();

        await loadAllComponents();

        applyThemePreference(currentThemePreference, false);

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        addSettingEventListeners();
        initHashChangeScroll();

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

        // Signal that page initialization is complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    } catch (error) {
        console.error('Failed to initialize: ' + error);
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    }
})
