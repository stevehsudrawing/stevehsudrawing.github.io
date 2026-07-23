/**
 * Vite entry point (lightweight).
 * For error pages (404) that do NOT need the Page Transition System,
 * QR code, link cards, or external link confirmation.
 *
 * Shares CSS and npm imports with main.ts, but uses the lightweight
 * init script that skips full-feature modules.
 */

// =========================================================================
// CSS imports (replaces <link> CDN tags)
// =========================================================================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Self-hosted fonts (replaces CDN <link> tags)
import '@fontsource-variable/inter/opsz.css';
import '@fontsource-variable/inter/opsz-italic.css';

// Project CSS — only the stylesheets used by lightweight pages
import './stylesheets/base.css';
import './stylesheets/theme.css';
import './stylesheets/fonts.css';
import './stylesheets/accessibility.css';
import './stylesheets/navbar.css';
import './stylesheets/scroll-hint.css';
import './stylesheets/loading-screen.css';
import './stylesheets/img-utils.css';
import './stylesheets/components.css';
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
// Project modules (only those needed by lightweight pages)
// =========================================================================

// --- Utilities ---
import './core/utils.js';
import './ui/page-title.js';

// --- Core systems ---
import './core/i18n.js';
import './ui/theme.js';

// --- UI features ---
import './core/img-utils.js';
import './ui/tooltips.js';
import './core/component-loader.js';
import './core/accessibility.js';
import './ui/scroll-hint.js';
import './core/loading-screen.js';
import './core/svg-utils.js';

// --- Detection helpers ---
import './core/bootstrap-css-detection.js';
import './core/no-copy.js';

// --- Link-cards (only for hash-change scroll support) ---
import './features/link-cards-generator.js';

// =========================================================================
// Early initialization
// =========================================================================
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
// Full initialization (lightweight — no Page Transition System)
// =========================================================================

import { AppEvent } from './types/app.js';
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
        document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
    } catch (error) {
        console.error('Failed to initialize: ' + error);
        // Still hide loading screen and signal completion even on error
        hideLoadingScreen();
        document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
    }
});

