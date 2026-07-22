/**
 * Vite entry point.
 * Replaces all CDN <link> + <script> tags with ESM imports.
 */

// =========================================================================
// CSS imports (replaces <link> CDN tags)
// =========================================================================
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Project CSS (order matters: base → theme → layouts → components)
import './stylesheets/modern/base.css';
import './stylesheets/modern/theme.css';
import './stylesheets/modern/fonts.css';
import './stylesheets/modern/accessibility.css';
import './stylesheets/modern/navbar.css';
import './stylesheets/modern/scroll-hint.css';
import './stylesheets/modern/loading-screen.css';
import './stylesheets/modern/page-transition.css';
import './stylesheets/modern/qr-code.css';
import './stylesheets/modern/img-utils.css';
import './stylesheets/modern/components.css';
import './stylesheets/modern/external-link-confirmation.css';
import './stylesheets/modern/no-copy.css';

// =========================================================================
// npm package imports (replaces CDN <script> tags)
// =========================================================================
import * as bootstrap from 'bootstrap';
import QRCode from 'qrcodejs';
import * as htmlToImage from 'html-to-image';
import html2canvas from 'html2canvas';
import { toHtml } from 'hast-util-to-html';

// Expose globals for legacy code that expects window.xxx
window.bootstrap = bootstrap;
window.QRCode = QRCode;
window.htmlToImage = htmlToImage;
window.html2canvas = html2canvas;
window.toHtml = toHtml;

// =========================================================================
// Project JS modules (order matters: dependencies before dependents)
// =========================================================================

// --- Utilities (used by everything else) ---
import './scripts/functions/core/utils.js';
import './scripts/functions/ui/page-title.js';

// --- Core systems ---
import './scripts/functions/core/i18n.js';
import './scripts/functions/ui/theme.js';

// --- UI features ---
import './scripts/functions/core/img-utils.js';
import './scripts/functions/ui/tooltips.js';
import './scripts/functions/core/component-loader.js';
import './scripts/functions/ui/navbar.js';
import './scripts/functions/ui/scroll-hint.js';
import './scripts/functions/core/accessibility.js';
import './scripts/functions/ui/settings.js';
import './scripts/functions/core/loading-screen.js';
import './scripts/functions/features/page-transition.js';
import './scripts/functions/features/external-link-confirmation.js';
import './scripts/functions/core/svg-utils.js';

// --- Code-dependent features ---
import './scripts/functions/features/qr-code.js';
import './scripts/functions/features/link-cards-generator.js';

// --- Detection helpers ---
import './scripts/functions/core/bootstrap-css-detection.js';
import './scripts/functions/core/no-copy.js';

// =========================================================================
// Early initialization (replaces init-at-head.js)
// =========================================================================
// Theme must be applied before the first paint to avoid flash.
// initThemePreference reads localStorage, applyThemePreference sets data-bs-theme.
if (typeof initThemePreference === 'function') {
    initThemePreference();
}
if (typeof initSystemThemeListener === 'function') {
    initSystemThemeListener();
}
if (typeof applyThemePreference === 'function' && typeof currentThemePreference !== 'undefined') {
    applyThemePreference(currentThemePreference, false);
}

// =========================================================================
// Full initialization (replaces init-final.js)
// =========================================================================
// init-final.js self-registers a DOMContentLoaded listener.
// Since Vite module scripts are deferred, DOMContentLoaded may already
// have fired. We check and either call directly or wait.
import './scripts/init-final.js';
