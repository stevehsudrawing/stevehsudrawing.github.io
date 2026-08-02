/**
 * Vite entry point (Vue 3 shell).
 * CSS imports, global npm exposures, and early theme initialization
 * remain here.  Feature initialization has moved to App.vue's onMounted.
 */

// =========================================================================
// CSS imports (replaces <link> CDN tags)
// =========================================================================
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Self-hosted fonts (replaces CDN <link> tags)
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/inter/opsz-italic.css";
import "@fontsource-variable/roboto-mono/wght.css";

// Project CSS (order matters: base -> theme -> layouts -> components)
import "./stylesheets/global/base.css";
import "./stylesheets/global/theme.css";
import "./stylesheets/global/fonts.css";
import "./stylesheets/global/accessibility.css";
import "./stylesheets/components/navbar.css";
import "./stylesheets/components/scroll-hint.css";
import "./stylesheets/components/loading-screen.css";
import "./stylesheets/components/loading-bar.css";
import "./stylesheets/components/page-transition.css";
import "./stylesheets/components/qr-code.css";
import "./stylesheets/components/img-utils.css";
import "./stylesheets/components/components.css";
import "./stylesheets/components/external-link-confirmation.css";
import "./stylesheets/components/no-copy.css";

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
// Project JS modules (order matters: dependencies before dependents)
// These side-effect imports register global handlers / extend prototypes.
// =========================================================================

// --- Utilities (used by everything else) ---
import "./core/utils.js";
import "./ui/page-title.js";

// --- Core systems ---
import "./core/i18n.js";
import "./ui/theme.js";

// --- UI features ---
import "./ui/img-utils.js";
import "./ui/tooltips.js";
import "./ui/navbar.js";
import "./ui/scroll-hint.js";
import "./ui/accessibility.js";
import "./ui/settings.js";
import "./ui/loading-screen.js";
import "./features/page-transition.js";
import "./features/external-link-confirmation.js";
import "./ui/svg-utils.js";

// --- Code-dependent features ---
import "./features/qr-code.js";

// --- Detection helpers ---
import "./ui/bootstrap-css-detection.js";
import "./ui/no-copy.js";

// =========================================================================
// Early initialization (before Vue mounts - prevents theme flash)
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
// Vue 3 application bootstrap
// Feature initialization is now orchestrated by App.vue's onMounted.
// =========================================================================
import { createApp } from "vue";
import App from "./App.vue";

const app = createApp(App);
app.mount("#app");
