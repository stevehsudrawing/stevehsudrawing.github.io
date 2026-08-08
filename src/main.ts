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

// =========================================================================
// npm package imports (replaces CDN <script> tags)
// =========================================================================
import * as bootstrap from "bootstrap";
import * as htmlToImage from "html-to-image";
import html2canvas from "html2canvas";

// Expose globals for legacy code that expects window.xxx
window.bootstrap = bootstrap;
window.htmlToImage = htmlToImage as unknown as Record<string, unknown>;
window.html2canvas = html2canvas;

// =========================================================================
// Project JS modules (order matters: dependencies before dependents)
// These side-effect imports register global handlers / extend prototypes.
// =========================================================================

// --- Utilities (used by everything else) ---
import "./core/utils";

// --- Core systems ---
import "./core/i18n";
import "./platform/theme";

// --- UI features ---
import "./platform/accessibility";

// --- Detection helpers ---
import "./platform/bootstrap-css-detection";

// =========================================================================
// Early initialization (before Vue mounts - prevents theme flash)
// =========================================================================
import {
  initSystemThemeListener,
  applyThemePreference,
} from "./platform/theme";
import { StorageKey } from "./types/app";
import type { ThemeChoice } from "./types/app";

initSystemThemeListener();
const initialTheme =
  (localStorage.getItem(StorageKey.Theme) as ThemeChoice | null) ?? "auto";
applyThemePreference(initialTheme, false);

// =========================================================================
// Vue 3 application bootstrap
// Feature initialization is now orchestrated by App.vue's onMounted.
// =========================================================================
import { createApp } from "vue";
import { vBTooltip } from "bootstrap-vue-next";
import { i18nPlugin } from "./plugins/i18n";
import { router } from "./router";
import App from "./App.vue";

const app = createApp(App);
app.use(i18nPlugin);
app.use(router);
app.directive("b-tooltip", vBTooltip);

app.mount("#app");
