document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();

        await loadAllComponents();

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        await loadLang(savedLang);

        updatePageTitle();
        initHashChangeScroll();

        // Add external link indicator icons
        addExternalLinkIndicators();

        // Set up copy-link tooltips before general tooltip activation
        initCopyLinkTooltips();

        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

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
