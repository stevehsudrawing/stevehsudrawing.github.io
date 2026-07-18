document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();

        await loadAllComponents();

        // Initialize theme transition overlay (after header is loaded)
        initThemeTransitionOverlay();

        // Load language file (URL query param takes priority over localStorage)
        await initLang();

        updateThemeToggleText();
        setActiveThemeItem();
        updatePageTitle();
        initHashChangeScroll();
        initNoCopyProtection();

        // Add external link indicator icons
        addAllExternalLinkIndicators();

        // Set up copy-link tooltips before general tooltip activation
        initAllCopyLinkTooltips();

        // Apply theme-based images (dark/light variants)
        applyAllThemeBasedImages();

        // Initialize image loading opacity (semi-transparent until loaded)
        initAllImageLoadingOpacity();

        // Inject inline SVGs from external files
        await initSvgInjection();

        // Re-initialize Bootstrap tooltips in new content
        initAllTooltips();

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
})
