document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadAllComponents();

        // Load supported languages and populate UI
        await loadSupportedLangs();

        initializeDropdownMenuAnimation();
        activateSkipButton();
        applyThemePreference(currentThemePreference, false);
        initializeSettingsModal();
        populateLanguageMenus();

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        addSettingEventListeners();

        updateThemeToggleText();
        setActiveThemeItem();

        activateTooltips();

        addEventListenerToTitleLinkAnchors();

        // Signal that page initialization is complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));

    } catch (error) {
        console.error('Failed to initialize: ' + error);
        // Still signal completion even on error, so the transition can complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    }
})