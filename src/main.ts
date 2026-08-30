/**
 * Vite entry point (Vue 3 shell).
 * CSS imports, global npm exposures, and early theme initialization
 * remain here.  Feature initialization has moved to App.vue's onMounted.
 */

// =========================================================================
// CSS imports
// =========================================================================
import "bootstrap-icons/font/bootstrap-icons.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Self-hosted fonts (replaces CDN <link> tags)
import "@fontsource-variable/inter/opsz-italic.css";
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/roboto-mono/wght.css";

// Project CSS (order matters: base -> theme -> layouts -> components)
import "./stylesheets/accessibility.css";
import "./stylesheets/base.css";
import "./stylesheets/fonts.css";
import "./stylesheets/on-image-controls.css";
import "./stylesheets/theme.css";

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
import "./platform/accessibility";
import "./platform/bootstrap-css-detection";
import "./platform/theme";

// =========================================================================
// Early initialization (before Vue mounts - prevents theme flash)
// =========================================================================
import { getStoredTheme } from "./platform/storage";
import {
  applyThemePreference,
  initSystemThemeListener,
} from "./platform/theme";

initSystemThemeListener();
applyThemePreference(getStoredTheme(), false);

// =========================================================================
// Vue 3 application bootstrap
// Feature initialization is now orchestrated by App.vue's onMounted.
// =========================================================================
import { vBTooltip } from "bootstrap-vue-next";
import { createApp } from "vue";
import App from "./App.vue";
import { i18nPlugin } from "./plugins/i18n";
import { router } from "./router";

const app = createApp(App);
app.use(i18nPlugin);
app.use(router);
app.directive("b-tooltip", vBTooltip);

app.mount("#app");
