<!--
  App.vue — Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.

  Phase 3: Modal components (Settings, ExternalLinkConfirm, QRCode)
  are rendered here with Vue-reactive state, replacing the legacy
  event-delegation + DOM-mutation approach.
-->
<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";

// =========================================================================
// Composables — reactive state layer (Phase 2)
// =========================================================================
import { useTheme } from "./composables/useTheme.js";
import { useI18n } from "./composables/useI18n.js";
import { useLocalStorage } from "./composables/useLocalStorage.js";

useTheme();
const { syncFromLangData } = useI18n();
useLocalStorage("openExternalLinksInNewTab", true);
useLocalStorage("enableAnimations", true);

// =========================================================================
// Modal components (Phase 3)
// =========================================================================
import SettingsModal from "./components/modals/SettingsModal.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";

/** Template refs for imperative show/hide via defineExpose. */
const settingsModalRef = ref<InstanceType<typeof SettingsModal>>();
const extLinkModalRef = ref<InstanceType<typeof ExternalLinkConfirmModal>>();
const qrCodeModalRef = ref<InstanceType<typeof QRCodeModal>>();

/** Reactive props passed to modal components. */
const extLinkUrl = ref("");
const extLinkImgProps = ref<Record<string, unknown> | null>(null);
const extLinkHideQR = ref(false);
const qrUrl = ref("");
const qrImgProps = ref<Record<string, unknown> | null>(null);
const qrHideOpenLink = ref(false);

// =========================================================================
// Event delegation — replaces initSettingEventListeners + initExternalLinkConfirmation + initQRCodeDelegation
// =========================================================================

/** Settings-open button: show SettingsModal. */
function onSettingsOpen(e: MouseEvent): void {
  const btn = (e.target as HTMLElement).closest("[data-settings-open]");
  if (!btn) return;
  e.preventDefault();
  settingsModalRef.value?.show();
}

/** External link click: show ExternalLinkConfirmModal. */
function onExternalLinkClick(e: MouseEvent): void {
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  if (e.button !== 0) return;

  const link = (e.target as HTMLElement).closest(
    "a.external-link",
  ) as HTMLAnchorElement | null;
  if (!link) return;
  const href = link.getAttribute("href");
  if (
    !href ||
    href.startsWith("javascript:") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  )
    return;
  if (link.hasAttribute("download") || link.hasAttribute("onclick")) return;

  e.preventDefault();

  const imgPropsJson = link.getAttribute("data-link-img-props");
  extLinkImgProps.value = imgPropsJson ? JSON.parse(imgPropsJson) : null;
  extLinkHideQR.value = link.hasAttribute("data-no-qr-code");
  extLinkUrl.value = href;
  extLinkModalRef.value?.show();
}

/** QR code trigger click: show QRCodeModal. */
function onQRTrigger(e: MouseEvent): void {
  const trigger = (e.target as HTMLElement).closest(
    "[data-qr-url]",
  ) as HTMLElement | null;
  if (!trigger) return;
  e.preventDefault();

  const url = trigger.getAttribute("data-qr-url");
  if (!url) return;

  qrHideOpenLink.value = trigger.hasAttribute("data-no-open-link");
  const iconAttr = trigger.getAttribute("data-qr-icon");
  qrImgProps.value = iconAttr
    ? (() => {
        try {
          return JSON.parse(iconAttr);
        } catch {
          return null;
        }
      })()
    : null;
  qrUrl.value = url;
  qrCodeModalRef.value?.show();
}

// =========================================================================
// Cross-modal navigation
// =========================================================================

function onExtLinkNavigate(url: string, openInNewTab: boolean): void {
  if (openInNewTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
}

function onExtLinkShowQR(
  url: string,
  imgProperties: Record<string, unknown> | null,
): void {
  qrUrl.value = url;
  qrImgProps.value = imgProperties;
  qrHideOpenLink.value = false;
  nextTick(() => qrCodeModalRef.value?.show());
}

function onQROpenLink(
  url: string,
  imgProperties: Record<string, unknown> | null,
): void {
  extLinkUrl.value = url;
  extLinkImgProps.value = imgProperties;
  extLinkHideQR.value = false;
  nextTick(() => extLinkModalRef.value?.show());
}

// =========================================================================
// Legacy init*() imports (coexisting — will shrink as more modules migrate)
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
import {
  initPageTransitionLinkClicks,
  initPageTransitionPopState,
} from "./features/page-transition.js";
import { initLang } from "./features/lang-switcher.js";
import { initHashChangeScroll, initSkipButton } from "./ui/accessibility.js";
import { initAllScrollHints } from "./ui/scroll-hint.js";
import { initNoCopyProtection } from "./ui/no-copy.js";

// =========================================================================
// Initialization orchestration
// =========================================================================

onMounted(async () => {
  try {
    initBootstrapCSSDetection();
    initThemeTransitionOverlay();
    initDropdownMenuAnimation();
    initSkipButton();

    // Set up tooltip i18n listener BEFORE initLang()
    initTooltipI18nListener();

    await initLang();

    // Sync the Vue plugin's messages ref from the legacy langData global,
    // so that $t() in Vue templates returns translated text (not just fallbacks).
    await syncFromLangData();

    // --- Phase 3: Vue-based event delegation replaces legacy modules ---
    document.addEventListener("click", onSettingsOpen);
    document.addEventListener("click", onExternalLinkClick);
    document.addEventListener("click", onQRTrigger);

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
// Post-initialization listeners
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
    Phase 3: Modal components are mounted here.  They render nothing
    until their internal `visible` ref is toggled via defineExpose.
  -->
  <SettingsModal ref="settingsModalRef" />
  <ExternalLinkConfirmModal
    ref="extLinkModalRef"
    :url="extLinkUrl"
    :img-properties="extLinkImgProps"
    :hide-q-r-button="extLinkHideQR"
    @navigate="onExtLinkNavigate"
    @show-qr="onExtLinkShowQR"
  />
  <QRCodeModal
    ref="qrCodeModalRef"
    :url="qrUrl"
    :img-properties="qrImgProps"
    :hide-open-link="qrHideOpenLink"
    @open-link="onQROpenLink"
  />
</template>
