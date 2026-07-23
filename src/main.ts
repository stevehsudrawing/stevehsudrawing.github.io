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
import './scripts/core/utils.js';
import './scripts/ui/page-title.js';

// --- Core systems ---
import './scripts/core/i18n.js';
import './scripts/ui/theme.js';

// --- UI features ---
import './scripts/core/img-utils.js';
import './scripts/ui/tooltips.js';
import './scripts/core/component-loader.js';
import './scripts/ui/navbar.js';
import './scripts/ui/scroll-hint.js';
import './scripts/core/accessibility.js';
import './scripts/ui/settings.js';
import './scripts/core/loading-screen.js';
import './scripts/features/page-transition.js';
import './scripts/features/external-link-confirmation.js';
import './scripts/core/svg-utils.js';

// --- Code-dependent features ---
import './scripts/features/qr-code.js';
import './scripts/features/link-cards-generator.js';

// --- Detection helpers ---
import './scripts/core/bootstrap-css-detection.js';
import './scripts/core/no-copy.js';

// =========================================================================
// Early initialization (replaces init-at-head.js)
// =========================================================================
// Theme must be applied before the first paint to avoid flash.
// initThemePreference reads localStorage, applyThemePreference sets data-bs-theme.
import {
    initThemePreference,
    initSystemThemeListener,
    applyThemePreference,
    currentThemePreference
} from './scripts/ui/theme.js';

initThemePreference();
initSystemThemeListener();
applyThemePreference(currentThemePreference, false);

// =========================================================================
// Full initialization (replaces init-final.js)
// =========================================================================
// init-final.js self-registers a DOMContentLoaded listener.
// Since Vite module scripts are deferred, DOMContentLoaded may already
// have fired. We check and either call directly or wait.
import './scripts/init-final.js';
