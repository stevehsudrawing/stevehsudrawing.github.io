/**
 * Vite entry point (Vue 3 shell).
 * CSS imports, global npm exposures, and early theme initialization
 * remain here.  Feature initialization has moved to App.vue's onMounted.
 */

// =========================================================================
// CSS imports
// =========================================================================
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

// Self-hosted fonts (replaces CDN <link> tags)
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/inter/opsz-italic.css";
import "@fontsource-variable/roboto-mono/wght.css";

// Project CSS (order matters: base -> theme -> layouts -> components)
import "./stylesheets/base.css";
import "./stylesheets/theme.css";
import "./stylesheets/fonts.css";
import "./stylesheets/accessibility.css";

// =========================================================================
// npm package imports
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
import "./core/utils";
import "./platform/theme";
import "./platform/accessibility";
import "./platform/bootstrap-css-detection";

// =========================================================================
// Early initialization (before Vue mounts - prevents theme flash)
// =========================================================================
import {
  initSystemThemeListener,
  applyThemePreference,
} from "./platform/theme";
import { getStoredTheme } from "./platform/storage";

initSystemThemeListener();
applyThemePreference(getStoredTheme(), false);

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
