<!--
  App.vue - Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.  No visible template yet;
  interactive components (modals, toasts) will be rendered here
  later via Teleport.
-->
<script setup lang="ts">
import { onMounted } from "vue";

// =========================================================================
// Composables — reactive state layer (Phase 2)
// These establish reactive theme / i18n state that future Vue components
// will consume.  They coexist with the imperative init*() calls below.
// =========================================================================
import { useTheme } from "./composables/useTheme.js";
import { useI18n } from "./composables/useI18n.js";
import { useLocalStorage } from "./composables/useLocalStorage.js";

// Reactive theme state (auto / light / dark + resolved effective theme).
// The watch inside useTheme syncs data-bs-theme + images via ui/theme.ts.
useTheme();

// Reactive i18n state (locale + messages + $t).
// The reactive messages ref is backed by the i18nPlugin registered in main.ts.
useI18n();

// Shared reactive preferences — will be consumed by SettingsModal in Phase 3.
useLocalStorage("openExternalLinksInNewTab", true);
useLocalStorage("enableAnimations", true);

// =========================================================================
// Init function imports (mirrors main.ts DOMContentLoaded handler)
// =========================================================================
import { AppEvent } from "./types/app.js";
import { initPageContent } from "./features/page-content-initializer.js";
import { initTooltipI18nListener } from "./ui/tooltips.js";
import {
  initThemeTransitionOverlay,
  updateThemeToggleText,
  setActiveThemeItem,
} from "./ui/theme.js";
import { hideLoadingScreen } from "./ui/loading-screen.js";
import { initBootstrapCSSDetection } from "./ui/bootstrap-css-detection.js";
import {
  initNavbarScrollBorder,
  initMobileNavbarBrandScroll,
  initDropdownMenuAnimation,
} from "./ui/navbar.js";
import { initSettingEventListeners, initSettingsModal } from "./ui/settings.js";
import {
  initPageTransitionLinkClicks,
  initPageTransitionPopState,
} from "./features/page-transition.js";
import { initExternalLinkConfirmation } from "./features/external-link-confirmation.js";
import { initQRCodeDelegation } from "./features/qr-code.js";
import { initLang } from "./features/lang-switcher.js";
import { initHashChangeScroll, initSkipButton } from "./ui/accessibility.js";
import { initAllScrollHints } from "./ui/scroll-hint.js";
import { initNoCopyProtection } from "./ui/no-copy.js";
import { initModalFocusManagement } from "./ui/modal.js";

// =========================================================================
// Initialization orchestration
// =========================================================================

onMounted(async () => {
  try {
    initBootstrapCSSDetection();
    initThemeTransitionOverlay();
    initDropdownMenuAnimation();
    initSkipButton();
    initModalFocusManagement();
    initSettingsModal();

    // Set up tooltip i18n listener BEFORE initLang()
    // so tooltip titles are updated when the first translation loads
    initTooltipI18nListener();

    await initLang();

    initSettingEventListeners();
    initExternalLinkConfirmation();
    initQRCodeDelegation();
    initHashChangeScroll();
    initNoCopyProtection();

    updateThemeToggleText();
    setActiveThemeItem();

    initPageTransitionLinkClicks();
    initPageTransitionPopState();

    await initPageContent();

    hideLoadingScreen();
    document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
  } catch (error) {
    console.error("Failed to initialize: " + error);
    hideLoadingScreen();
    document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
  }
});

// =========================================================================
// Post-initialization listeners (triggered after initPageContent completes)
// =========================================================================

document.addEventListener(AppEvent.PageInitialized, initNavbarScrollBorder);
document.addEventListener(
  AppEvent.PageInitialized,
  initMobileNavbarBrandScroll,
);
document.addEventListener(AppEvent.PageInitialized, initAllScrollHints);
</script>

<template>
  <!--
    Vue shell: no visible content yet.
    Interactive components (modals, toasts) will be rendered here
    later via Teleport once individual features are componentized.
  -->
</template>
