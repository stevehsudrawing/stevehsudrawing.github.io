import { initPageContent } from './features/init-page-content.js';
import { initTooltipI18nListener } from './ui/tooltips.js';
import { initThemeTransitionOverlay, updateThemeToggleText, setActiveThemeItem } from './ui/theme.js';
import { hideLoadingScreen } from './core/loading-screen.js';
import { loadAllComponents } from './core/component-loader.js';
import { initBootstrapCSSDetection } from './core/bootstrap-css-detection.js';
import { initNavbarScrollBorder, initMobileNavbarBrandScroll, initDropdownMenuAnimation } from './ui/navbar.js';
import { initSettingEventListeners, initSettingsModal } from './ui/settings.js';
import { initPageTransitionLinkClicks, initPageTransitionPopState } from './features/page-transition.js';
import { initExternalLinkConfirmation } from './features/external-link-confirmation.js';
import { initHashChangeScroll } from './features/link-cards-generator.js';
import { initQRCodeDelegation } from './features/qr-code.js';
import { loadSupportedLangs, populateLanguageMenus, initLang } from './core/i18n.js';
import { initSkipButton } from './core/accessibility.js';
import { initAllScrollHints } from './ui/scroll-hint.js';
import { initNoCopyProtection } from './core/no-copy.js';

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
        initQRCodeDelegation();
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
