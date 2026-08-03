<!--
  App.vue -- Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.

  Phase 3: Modal components (Settings, ExternalLinkConfirm, QRCode)
  are rendered here with Vue-reactive state, replacing the legacy
  event-delegation + DOM-mutation approach.
-->
<script setup lang="ts">
import { ref, onMounted, nextTick, provide } from "vue";

// =========================================================================
// Imports
// =========================================================================

// Composables
import { useTheme } from "./composables/useTheme.js";
import { useI18n } from "./composables/useI18n.js";
import { useLocalStorage } from "./composables/useLocalStorage.js";
import { SHOW_TOAST_KEY } from "./composables/useToast.js";

// UI components (template refs)
import SettingsModal from "./components/modals/SettingsModal.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";
import LoadingScreen from "./components/ui/LoadingScreen.vue";
import LoadingBar from "./components/ui/LoadingBar.vue";
import ScrollHint from "./components/ui/ScrollHint.vue";
import CopyProtectedImg from "./components/ui/CopyProtectedImg.vue";
import InlineSvg from "./components/ui/InlineSvg.vue";
import FeatureAwareImg from "./components/ui/FeatureAwareImg.vue";
import AppNavbar from "./components/layout/AppNavbar.vue";
import FooterNav from "./components/layout/FooterNav.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Legacy modules (init*() -- Phase 7 will eliminate these)
import { AppEvent, StorageKey } from "./types/app.js";
import { initPageContent } from "./features/page-content-initializer.js";
import { initTooltipI18nListener } from "./ui/tooltips.js";
import {
  initThemeTransitionOverlay,
  updateThemeToggleText,
  setActiveThemeItem,
} from "./ui/theme.js";
import { initBootstrapCSSDetection } from "./ui/bootstrap-css-detection.js";
import {
  initPageTransitionLinkClicks,
  initPageTransitionPopState,
} from "./features/page-transition.js";
import { initLang } from "./features/lang-switcher.js";
import { initHashChangeScroll, initSkipButton } from "./ui/accessibility.js";
import { initAllScrollHints } from "./ui/scroll-hint.js";
import { normalizeInternalPath } from "./core/utils.js";

// =========================================================================
// State
// =========================================================================

useTheme();
const { syncFromLangData } = useI18n();
useLocalStorage(StorageKey.OpenInNewTab, true);
useLocalStorage(StorageKey.EnableAnimations, true);

/** Template refs for imperative show/hide via defineExpose. */
const settingsModalRef = ref<InstanceType<typeof SettingsModal>>();
const extLinkModalRef = ref<InstanceType<typeof ExternalLinkConfirmModal>>();
const qrCodeModalRef = ref<InstanceType<typeof QRCodeModal>>();
const loadingScreenRef = ref<InstanceType<typeof LoadingScreen>>();
const loadingBarRef = ref<InstanceType<typeof LoadingBar>>();
const scrollHintRef = ref<InstanceType<typeof ScrollHint>>();
const copyProtectedImgRef = ref<InstanceType<typeof CopyProtectedImg>>();
const appNavbarRef = ref<InstanceType<typeof AppNavbar>>();
const toastStackRef = ref<InstanceType<typeof ToastStack>>();

/** Reactive current page path -- drives AppNavbar active state + brand text. */
const currentPage = ref(normalizeInternalPath(window.location.pathname));

/**
 * Provide a global showToast function to all descendant components.
 * Delegates to ToastStack once it is mounted.  This is needed because
 * ToastStack is a sibling, not an ancestor, of the modal components.
 */
provide(SHOW_TOAST_KEY, (type: "success" | "error", message: string) => {
  toastStackRef.value?.showToast(type, message);
});

/** Reactive props passed to modal components. */
const extLinkUrl = ref("");
const extLinkImgProps = ref<Record<string, unknown> | null>(null);
const extLinkHideQR = ref(false);
const qrUrl = ref("");
const qrImgProps = ref<Record<string, unknown> | null>(null);
const qrHideOpenLink = ref(false);

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// Event delegation
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// Cross-modal navigation
// -------------------------------------------------------------------------

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

// -------------------------------------------------------------------------
// Initialization orchestration
// -------------------------------------------------------------------------

onMounted(async () => {
  try {
    initBootstrapCSSDetection();
    initThemeTransitionOverlay();
    initSkipButton();

    // Set up tooltip i18n listener BEFORE initLang()
    initTooltipI18nListener();

    // Bridge: expose Vue components to legacy TS modules (before initLang
    // so the loading bar can show during language file fetch).
    if (loadingBarRef.value) window.__loadingBar = loadingBarRef.value;
    if (scrollHintRef.value) window.__scrollHint = scrollHintRef.value;
    if (copyProtectedImgRef.value) window.__noCopy = copyProtectedImgRef.value;
    if (appNavbarRef.value) window.__navbar = appNavbarRef.value;

    await initLang();

    // Sync the Vue plugin's messages ref from the legacy langData global,
    // so that $t() in Vue templates returns translated text (not just fallbacks).
    await syncFromLangData();

    // Vue-based event delegation replaces legacy modules
    document.addEventListener("click", onSettingsOpen);
    document.addEventListener("click", onExternalLinkClick);
    document.addEventListener("click", onQRTrigger);

    initHashChangeScroll();

    updateThemeToggleText();
    setActiveThemeItem();

    initPageTransitionLinkClicks();
    initPageTransitionPopState();

    await initPageContent();

    loadingScreenRef.value?.hide();

    document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
  } catch (error) {
    console.error("Failed to initialize: " + error);
    loadingScreenRef.value?.hide();

    document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
  }
});

// -------------------------------------------------------------------------
// Post-initialization listeners
// -------------------------------------------------------------------------

document.addEventListener(AppEvent.PageInitialized, () => {
  currentPage.value = normalizeInternalPath(window.location.pathname);
});

document.addEventListener(AppEvent.PageInitialized, initAllScrollHints);
</script>

<template>
  <!--
    Static elements that were previously injected at build time via
    build/page-components/header.html.  They live outside the Vue
    render tree (fixed-positioned) but are now rendered here so they
    are guaranteed to exist at page load.
  -->
  <div class="theme-transition-overlay"></div>
  <a
    id="skip-button"
    href="#page-content"
    class="btn btn-primary"
    role="button"
    data-i18n="text-skip-to-content"
    >Skip to Content</a
  >

  <!--
    Phase 3: Modal components are mounted here.  They render nothing
    until their internal `visible` ref is toggled via defineExpose.
  -->
  <AppNavbar ref="appNavbarRef" :current-page="currentPage" />
  <LoadingScreen ref="loadingScreenRef" />
  <LoadingBar ref="loadingBarRef" />
  <ScrollHint ref="scrollHintRef" />
  <CopyProtectedImg ref="copyProtectedImgRef" />
  <ToastStack ref="toastStackRef" />
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
  <FooterNav />
</template>
