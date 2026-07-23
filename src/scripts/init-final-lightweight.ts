
import { addAllExternalLinkIndicators } from './core/accessibility.js';
import { initBootstrapCSSDetection } from './core/bootstrap-css-detection.js';
import { loadAllComponents } from './core/component-loader.js';
import { initLang } from './core/i18n.js';
import { initAllImageLoadingOpacity } from './core/img-utils.js';
import { initHashChangeScroll } from './features/link-cards-generator.js';
import { hideLoadingScreen } from './core/loading-screen.js';
import { initNoCopyProtection } from './core/no-copy.js';
import { updatePageTitle } from './ui/page-title.js';
import { initSvgInjection } from './core/svg-utils.js';
import { applyAllThemeBasedImages, initThemeTransitionOverlay, setActiveThemeItem, updateThemeToggleText } from './ui/theme.js';
import { initAllCopyLinkTooltips, initAllTooltips, initTooltipI18nListener } from './ui/tooltips.js';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();

        await loadAllComponents();

        // Initialize theme transition overlay (after header is loaded)
        initThemeTransitionOverlay();

        // Set up tooltip i18n listener BEFORE initLang()
        initTooltipI18nListener();

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
});
