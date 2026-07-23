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
import './scripts/core/utils.js';
import './scripts/ui/page-title.js';

// --- Core systems ---
import './scripts/core/i18n.js';
import './scripts/ui/theme.js';

// --- UI features ---
import './scripts/core/img-utils.js';
import './scripts/ui/tooltips.js';
import './scripts/core/component-loader.js';
import './scripts/core/accessibility.js';
import './scripts/ui/scroll-hint.js';
import './scripts/core/loading-screen.js';
import './scripts/core/svg-utils.js';

// --- Detection helpers ---
import './scripts/core/bootstrap-css-detection.js';
import './scripts/core/no-copy.js';

// --- Link-cards (only for hash-change scroll support) ---
import './scripts/features/link-cards-generator.js';

// =========================================================================
// Early initialization (replaces init-at-head.js)
// =========================================================================
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
// Full initialization (lightweight — no Page Transition System)
// =========================================================================
import './scripts/init-final-lightweight.js';
