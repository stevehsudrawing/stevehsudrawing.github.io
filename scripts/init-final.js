/**
 * Initialize page-content-specific elements.
 * Called both on first load and after page transitions.
 */
async function initializePageContent() {
    // Apply cached translations to static page content first
    if (currentLang && Object.keys(langData).length > 0) {
        updatePageText();
        setActiveNavItem();
        setActiveLangItem();
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = currentLang;
        }
    }

    // Generate link cards if #links container exists
    await generateLinkCards();

    // Apply translations again — link cards were just added to the DOM
    if (currentLang && Object.keys(langData).length > 0) {
        updatePageText();
    }

    // Set up copy-link tooltips before general tooltip activation
    initCopyLinkTooltips();

    // Re-initialize Bootstrap tooltips in new content
    activateTooltips();

    // Re-bind title link anchor click handlers
    addEventListenerToTitleLinkAnchors();

    // Apply theme-based images (dark/light variants)
    applyThemeBasedImages();

    // Apply external link target behavior
    applyExternalLinkTargetBehavior();

    // Add external link indicator icons
    addExternalLinkIndicators();

    // Re-initialize scroll hint for overflowing button groups
    initScrollHint();
}

document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();

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
        initHashChangeScroll();

        updateThemeToggleText();
        setActiveThemeItem();

        // Initialize page transition listeners (internal link clicks & popstate)
        initPageTransitionLinkClicks();
        initPageTransitionPopState();

        // Initialize page content (link cards, tooltips, etc.)
        await initializePageContent();

        // Signal that page initialization is complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));

    } catch (error) {
        console.error('Failed to initialize: ' + error);
        // Still signal completion even on error, so the transition can complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    }
});

// Listeners that depend on pageInitialized event
document.addEventListener('pageInitialized', initMobileNavbarBrandScroll);
document.addEventListener('pageInitialized', initScrollHint);
