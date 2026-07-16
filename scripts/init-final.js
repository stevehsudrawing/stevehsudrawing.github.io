/**
 * Initialize page-content-specific elements.
 * Called both on first load and after page transitions.
 */
async function initPageContent() {
    // Update the navbar brand page-name for the current page
    if (typeof updateNavbarBrandText === 'function') {
        updateNavbarBrandText();
    }

    // Apply cached translations to static page content first
    if (currentLang && Object.keys(langData).length > 0) {
        updatePageText();
        updatePageTitle();
        setActiveNavItem();
        setActiveLangItem();
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = currentLang;
        }
    }

    // Generate link cards if #links container exists
    await generateLinkCards();

    // Apply translations again - link cards were just added to the DOM
    if (currentLang && Object.keys(langData).length > 0) {
        updatePageText();
    }

    // Set up copy-link tooltips before general tooltip activation
    initCopyLinkTooltips();

    // Re-initialize Bootstrap tooltips in new content
    initAllTooltips();

    // Re-bind title link anchor click handlers
    initTitleLinkAnchors();

    // Apply theme-based images (dark/light variants)
    applyAllThemeBasedImages();

    // Initialize colored (mask-based) images
    initAllColoredImages();

    // Inject inline SVGs from external files
    await initSvgInjection();

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

        // Initialize theme transition overlay (after header is loaded)
        initThemeTransitionOverlay();

        // Load supported languages and populate UI
        await loadSupportedLangs();

        initDropdownMenuAnimation();
        initSkipButton();
        initSettingsModal();
        populateLanguageMenus();

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        initSettingEventListeners();
        initHashChangeScroll();
        initNoCopyProtection();

        updateThemeToggleText();
        setActiveThemeItem();

        // Initialize page transition listeners (internal link clicks & popstate)
        initPageTransitionLinkClicks();
        initPageTransitionPopState();

        // Initialize page content (link cards, tooltips, etc.)
        await initPageContent();

        // Hide the loading screen now that everything is ready
        hideLoadingScreen();

        // Signal that page initialization is complete
        document.dispatchEvent(new CustomEvent('pageInitialized'));

    } catch (error) {
        console.error('Failed to initialize: ' + error);
        // Still hide loading screen and signal completion even on error
        hideLoadingScreen();
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    }
});

// Listeners that depend on pageInitialized event
document.addEventListener('pageInitialized', initNavbarScrollBorder);
document.addEventListener('pageInitialized', initMobileNavbarBrandScroll);
document.addEventListener('pageInitialized', initScrollHint);
