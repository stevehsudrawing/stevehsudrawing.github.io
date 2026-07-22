import { initPageContent } from './functions/features/init-page-content.js';
import { initTooltipI18nListener } from './functions/ui/tooltips.js';
import { initThemeTransitionOverlay, updateThemeToggleText, setActiveThemeItem } from './functions/ui/theme.js';
import { hideLoadingScreen } from './functions/core/loading-screen.js';
import { loadAllComponents } from './functions/core/component-loader.js';
import { initBootstrapCSSDetection } from './functions/core/bootstrap-css-detection.js';
import { initNavbarScrollBorder, initMobileNavbarBrandScroll, initDropdownMenuAnimation } from './functions/ui/navbar.js';
import { initSettingEventListeners, initSettingsModal } from './functions/ui/settings.js';
import { initPageTransitionLinkClicks, initPageTransitionPopState } from './functions/features/page-transition.js';
import { initExternalLinkConfirmation } from './functions/features/external-link-confirmation.js';
import { initHashChangeScroll } from './functions/features/link-cards-generator.js';
import { loadSupportedLangs, populateLanguageMenus, initLang } from './functions/core/i18n.js';
import { initSkipButton } from './functions/core/accessibility.js';
import { initAllScrollHints } from './functions/ui/scroll-hint.js';
import { initNoCopyProtection } from './functions/core/no-copy.js';

document.addEventListener('DOMContentLoaded', async function () {
    try {
        initBootstrapCSSDetection();
        await loadAllComponents();
        initThemeTransitionOverlay();
        await loadSupportedLangs();

        initDropdownMenuAnimation();
        initSkipButton();
        initSettingsModal();
        populateLanguageMenus();

        // Set up tooltip i18n listener BEFORE initLang()
        // so tooltip titles are updated when the first translation loads
        initTooltipI18nListener();

        await initLang();

        initSettingEventListeners();
        initExternalLinkConfirmation();
        initHashChangeScroll();
        initNoCopyProtection();

        updateThemeToggleText();
        setActiveThemeItem();

        initPageTransitionLinkClicks();
        initPageTransitionPopState();

        await initPageContent();

        hideLoadingScreen();
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    } catch (error) {
        console.error('Failed to initialize: ' + error);
        hideLoadingScreen();
        document.dispatchEvent(new CustomEvent('pageInitialized'));
    }
});

document.addEventListener('pageInitialized', initNavbarScrollBorder);
document.addEventListener('pageInitialized', initMobileNavbarBrandScroll);
document.addEventListener('pageInitialized', initAllScrollHints);
