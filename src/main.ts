/**
 * Vite entry point (Vue 3 shell).
 * CSS imports, global npm exposures, and early theme initialization
 * remain here.  Feature initialization has moved to App.vue's onMounted.
 */

// =========================================================================
// CSS imports
// =========================================================================
// Bootstrap, compiled from source by the Sass settings in vite.config.ts
import "./stylesheets/bootstrap.scss";

// Self-hosted fonts (replaces CDN <link> tags)
import "@fontsource-variable/inter/opsz-italic.css";
import "@fontsource-variable/inter/opsz.css";
import "@fontsource-variable/roboto-mono/wght.css";

// Project CSS. The order is the cascade: a sheet that restates a Bootstrap
// component variable at equal specificity has to load after the framework and
// after the sheets that restate the same variables, which is why `base.css`
// comes last.
import "./stylesheets/theme.scss";
import "./stylesheets/parameters.css";
import "./stylesheets/fonts.css";
import "./stylesheets/on-image-controls.css";
import "./stylesheets/base.css";

// =========================================================================
// npm package imports
// =========================================================================
import * as htmlToImage from "html-to-image";

// Expose globals for legacy code that expects window.xxx
window.htmlToImage = htmlToImage as unknown as Record<string, unknown>;

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
