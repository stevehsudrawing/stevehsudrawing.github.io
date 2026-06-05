document.addEventListener('DOMContentLoaded', async function () {
    try {
        await loadHTML('header', '/sub-pages/header.html');
        await loadHTML('footer', '/sub-pages/footer.html');
        await loadHTML('qrCodeModalContainer', '/sub-pages/qr-code-modal.html');
        await loadHTML('settingsModalContainer', '/sub-pages/settings-modal.html');

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

    } catch (error) {
        console.error('Failed to initialize: ' + error);
    }
})