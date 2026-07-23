/**
 * Vite entry point.
 * Replaces all CDN <link> + <script> tags with ESM imports.
 */

// =========================================================================
// CSS imports (replaces <link> CDN tags)
// =========================================================================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Self-hosted fonts (replaces CDN <link> tags)
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/inter/opsz-italic.css';

// Project CSS (order matters: base → theme → layouts → components)
import './stylesheets/base.css';
import './stylesheets/theme.css';
import './stylesheets/fonts.css';
import './stylesheets/accessibility.css';
import './stylesheets/navbar.css';
import './stylesheets/scroll-hint.css';
import './stylesheets/loading-screen.css';
import './stylesheets/page-transition.css';
import './stylesheets/qr-code.css';
import './stylesheets/img-utils.css';
import './stylesheets/components.css';
import './stylesheets/external-link-confirmation.css';
import './stylesheets/no-copy.css';

// =========================================================================
// npm package imports (replaces CDN <script> tags)
// =========================================================================
import * as bootstrap from 'bootstrap';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import { toHtml } from 'hast-util-to-html';

// Expose globals for legacy code that expects window.xxx
window.bootstrap = bootstrap;
window.htmlToImage = htmlToImage as unknown as Record<string, unknown>;
window.html2canvas = html2canvas;
window.toHtml = toHtml;

// =========================================================================
// Project JS modules (order matters: dependencies before dependents)
// =========================================================================

// --- Utilities (used by everything else) ---
import './core/utils.js';
import './ui/page-title.js';

// --- Core systems ---
import './core/i18n.js';
import './ui/theme.js';

// --- UI features ---
import './core/img-utils.js';
import './ui/tooltips.js';
import './core/component-loader.js';
import './ui/navbar.js';
import './ui/scroll-hint.js';
import './core/accessibility.js';
import './ui/settings.js';
import './core/loading-screen.js';
import './features/page-transition.js';
import './features/external-link-confirmation.js';
import './core/svg-utils.js';

// --- Code-dependent features ---
import './features/qr-code.js';
import './features/link-cards-generator.js';

// --- Detection helpers ---
import './core/bootstrap-css-detection.js';
import './core/no-copy.js';

// =========================================================================
// Early initialization
// =========================================================================
// Theme must be applied before the first paint to avoid flash.
// initThemePreference reads localStorage, applyThemePreference sets data-bs-theme.
import {
    initThemePreference,
    initSystemThemeListener,
    applyThemePreference,
    currentThemePreference
} from './ui/theme.js';

initThemePreference();
initSystemThemeListener();
applyThemePreference(currentThemePreference, false);

// =========================================================================
// Full initialization (replaces init-final.js)
// =========================================================================
// init-final.js self-registers a DOMContentLoaded listener.
// Since Vite module scripts are deferred, DOMContentLoaded may already
// have fired. We check and either call directly or wait.
import { AppEvent } from './types/app.js';
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
        document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
    } catch (error) {
        console.error('Failed to initialize: ' + error);
        hideLoadingScreen();
        document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
    }
});

document.addEventListener(AppEvent.PageInitialized, initNavbarScrollBorder);
document.addEventListener(AppEvent.PageInitialized, initMobileNavbarBrandScroll);
document.addEventListener(AppEvent.PageInitialized, initAllScrollHints);

