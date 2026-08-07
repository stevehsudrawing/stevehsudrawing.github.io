<!--
  App.vue -- Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.

  Phase 3: Modal components (Settings, ExternalLinkConfirm, QRCode)
  are rendered here with Vue-reactive state, replacing the legacy
  event-delegation + DOM-mutation approach.
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, provide } from "vue";

// =========================================================================
// Imports
// =========================================================================

// Vue Router (Phase 7)
import { useRouter, useRoute } from "vue-router";

// Composables
import { useTheme } from "./composables/useTheme";
import { useI18n } from "./composables/useI18n";
import { useLocalStorage } from "./composables/useLocalStorage";
import { usePageNavigation } from "./composables/usePageNavigation";
import { useCrossModalNavigation } from "./composables/useCrossModalNavigation";
import { SHOW_TOAST_KEY } from "./composables/useToast";

// UI components (template refs)
import SettingsModal from "./components/modals/SettingsModal.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";
import LoadingScreen from "./components/ui/LoadingScreen.vue";
import LoadingBar from "./components/ui/LoadingBar.vue";
import CopyProtectedImg from "./components/ui/CopyProtectedImg.vue";
import SkipButton from "./components/buttons/SkipButton.vue";
import AppNavbar from "./components/layout/AppNavbar.vue";
import FooterNav from "./components/layout/FooterNav.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Legacy modules (diminishing — Phase 7 will eliminate most)
import { StorageKey } from "./types/app";
import { initBootstrapCSSDetection } from "./ui/bootstrap-css-detection";
import {
  initHashChangeScroll,
  initInputModalityDetection,
  addAllExternalLinkIndicators,
} from "./ui/accessibility";
import { normalizeInternalPath } from "./core/utils";

// =========================================================================
// State
// =========================================================================

useTheme();
const { initLang, isLanguageLoading, messages } = useI18n();
useLocalStorage(StorageKey.OpenInNewTab, true);
const enableAnimations = useLocalStorage(StorageKey.EnableAnimations, true);

// ---- Sync .no-animations class to <html> ----

watch(
  enableAnimations,
  (val) => {
    document.documentElement.classList.toggle("no-animations", !val);
  },
  { immediate: true },
);

// ---- LoadingBar via i18n language-loading state ----

watch(isLanguageLoading, (loading) => {
  if (loading) {
    loadingBarRef.value?.show();
  } else {
    loadingBarRef.value?.complete();
  }
});

// ---- External link indicators via i18n message changes ----

watch(messages, async () => {
  await nextTick();
  addAllExternalLinkIndicators();
});

/** Vue Router instance (for guards + programmatic navigation). */
const router = useRouter();

/** Current route (reactive — drives Navbar active state). */
const route = useRoute();
const currentPage = computed(() => normalizeInternalPath(route.path));

/** Template refs for imperative show/hide via defineExpose. */
const settingsModalRef = ref<InstanceType<typeof SettingsModal>>();
const extLinkModalRef = ref<InstanceType<typeof ExternalLinkConfirmModal>>();
const qrCodeModalRef = ref<InstanceType<typeof QRCodeModal>>();
const loadingScreenRef = ref<InstanceType<typeof LoadingScreen>>();
const loadingBarRef = ref<InstanceType<typeof LoadingBar>>();
const toastStackRef = ref<InstanceType<typeof ToastStack>>();

// ---- Router guards (LoadingBar, dimming, indicators, title, ?lang=) ----

usePageNavigation(router, loadingBarRef);

// ---- Cross-modal state (ExternalLink <-> QRCode) ----

const {
  extLinkUrl,
  extLinkImgProps,
  extLinkHideQR,
  qrUrl,
  qrImgProps,
  qrHideOpenLink,
  onExtLinkNavigate,
  onExtLinkShowQR,
  onQROpenLink,
} = useCrossModalNavigation(qrCodeModalRef, extLinkModalRef);

// ---- Toast injection ----
/**
 * Provide a global showToast function to all descendant components.
 * Delegates to ToastStack once it is mounted.  This is needed because
 * ToastStack is a sibling, not an ancestor, of the modal components.
 */
provide(SHOW_TOAST_KEY, (type: "success" | "error", message: string) => {
  toastStackRef.value?.showToast(type, message);
});

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
// Internal-link navigation (Phase 7 — delegates to Vue Router)
// -------------------------------------------------------------------------

/**
 * Intercept clicks on .internal-link elements and delegate to Vue Router
 * for SPA-style navigation without page reload.
 */
function onInternalLinkClick(e: MouseEvent): void {
  // Pass through: modifier keys (open in new tab), non-left-click
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  if (e.button !== 0) return;

  const link = (e.target as HTMLElement).closest(
    "a",
  ) as HTMLAnchorElement | null;
  if (!link) return;

  // Only handle .internal-link (not .external-link)
  if (!link.classList.contains("internal-link")) return;

  const href = link.getAttribute("href");
  if (!href) return;

  e.preventDefault();
  router.push(href);
}

// -------------------------------------------------------------------------
// Initialization orchestration
// -------------------------------------------------------------------------

onMounted(async () => {
  try {
    initBootstrapCSSDetection();
    initInputModalityDetection();

    await initLang();

    await nextTick();
    addAllExternalLinkIndicators();

    // Vue-based event delegation
    document.addEventListener("click", onSettingsOpen);
    document.addEventListener("click", onExternalLinkClick);
    document.addEventListener("click", onQRTrigger);
    document.addEventListener("click", onInternalLinkClick);

    initHashChangeScroll();

    loadingScreenRef.value?.hide();
  } catch (error) {
    console.error("Failed to initialize: " + error);
    loadingScreenRef.value?.hide();
  }
});
</script>

<template>
  <!-- Static overlay elements.  Live outside the main flow. -->
  <SkipButton />

  <AppNavbar ref="appNavbarRef" :current-page="currentPage" />
  <LoadingScreen ref="loadingScreenRef" />
  <LoadingBar ref="loadingBarRef" />

  <!--
    #page-content is rendered by Vue so it is always present when
    Vue has mounted.  The <router-view> inside renders the current
    page component (Phase 7: replaces static HTML + page-transition.ts).
  -->
  <main id="page-content">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
  </main>

  <FooterNav />

  <!--
    Modals + invisible global components: mounted here, shown/hidden
    via defineExpose + template refs.
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
  <CopyProtectedImg ref="copyProtectedImgRef" />
  <ToastStack ref="toastStackRef" />
</template>
