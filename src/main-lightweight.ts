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
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Self-hosted fonts (replaces CDN <link> tags)
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/inter/opsz-italic.css";

// Project CSS - only the stylesheets used by lightweight pages
import "./stylesheets/base.css";
import "./stylesheets/theme.css";
import "./stylesheets/fonts.css";
import "./stylesheets/accessibility.css";
import "./stylesheets/navbar.css";
import "./stylesheets/scroll-hint.css";
import "./stylesheets/loading-screen.css";
import "./stylesheets/loading-bar.css";
import "./stylesheets/img-utils.css";
import "./stylesheets/components.css";
import "./stylesheets/no-copy.css";

// =========================================================================
// npm package imports (replaces CDN <script> tags)
// =========================================================================
import * as bootstrap from "bootstrap";
import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";
import { toHtml } from "hast-util-to-html";

// Expose globals for legacy code that expects window.xxx
window.bootstrap = bootstrap;
window.htmlToImage = htmlToImage as unknown as Record<string, unknown>;
window.html2canvas = html2canvas;
window.toHtml = toHtml;

// =========================================================================
// Project modules (only those needed by lightweight pages)
// =========================================================================

// --- Utilities ---
import "./core/utils.js";
import "./ui/page-title.js";

// --- Core systems ---
import "./core/i18n.js";
import "./ui/theme.js";

// --- UI features ---
import "./ui/img-utils.js";
import "./ui/tooltips.js";
import "./ui/accessibility.js";
import "./ui/scroll-hint.js";
import "./ui/loading-screen.js";
import "./ui/svg-utils.js";

// --- Detection helpers ---
import "./ui/bootstrap-css-detection.js";
import "./ui/no-copy.js";

// =========================================================================
// Early initialization
// =========================================================================
import {
  initThemePreference,
  initSystemThemeListener,
  applyThemePreference,
  currentThemePreference,
} from "./ui/theme.js";

initThemePreference();
initSystemThemeListener();
applyThemePreference(currentThemePreference, false, false);

// =========================================================================
// Full initialization (lightweight - no Page Transition System)
// =========================================================================

import { AppEvent } from "./types/app.js";
import { addAllExternalLinkIndicators } from "./ui/accessibility.js";
import { initBootstrapCSSDetection } from "./ui/bootstrap-css-detection.js";
import { initLang } from "./features/lang-switcher.js";
import { initAllImageLoadingOpacity } from "./ui/img-utils.js";
import { initHashChangeScroll } from "./ui/accessibility.js";
import { hideLoadingScreen } from "./ui/loading-screen.js";
import { initNoCopyProtection } from "./ui/no-copy.js";
import { updatePageTitle } from "./ui/page-title.js";
import { initSvgInjection } from "./ui/svg-utils.js";
import {
  applyAllThemeBasedImages,
  initThemeTransitionOverlay,
  setActiveThemeItem,
  updateThemeToggleText,
} from "./ui/theme.js";
import { initAllTooltips, initTooltipI18nListener } from "./ui/tooltips.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    initBootstrapCSSDetection();

    // Initialize theme transition overlay
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
    console.error("Failed to initialize: " + error);
    // Still hide loading screen and signal completion even on error
    hideLoadingScreen();
    document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
  }
});
