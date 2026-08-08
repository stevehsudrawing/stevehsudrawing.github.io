<!--
  App.vue — Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.
-->
<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, provide } from "vue";

// =========================================================================
// Imports
// =========================================================================

// Vue Router
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
import SkipButton from "./components/buttons/SkipButton.vue";
import AppNavbar from "./components/nav/AppNavbar.vue";
import FooterNav from "./components/nav/FooterNav.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Platform-level modules
import {
  StorageKey,
  OPEN_EXTERNAL_LINK_KEY,
  OPEN_QR_CODE_KEY,
  OPEN_SETTINGS_KEY,
} from "./types/app";
import type { FeatureAwareImgProps } from "./types/app";
import { initBootstrapCSSDetection } from "./platform/bootstrap-css-detection";
import {
  initHashChangeScroll,
  initInputModalityDetection,
} from "./platform/accessibility";
import { initNoCopyProtection } from "./platform/no-copy";
import { normalizeInternalPath } from "./core/utils";

// =========================================================================
// State
// =========================================================================

useTheme();
const { initLang, isLanguageLoading, messages, t } = useI18n();
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

usePageNavigation(router, loadingBarRef, t);

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

// ---- Settings-modal injection (consumed by AppNavbar gear button) ----

provide(OPEN_SETTINGS_KEY, () => {
  settingsModalRef.value?.show();
});

// ---- External-link & QR-code injection (consumed by TypeAwareLink, QRCodeButton) ----

provide(
  OPEN_EXTERNAL_LINK_KEY,
  (url: string, imgProps: FeatureAwareImgProps | null, hideQR: boolean) => {
    extLinkUrl.value = url;
    // Convert FeatureAwareImgProps -> HastProperties format for
    // useImgDisplayProps() in ExternalLinkConfirmModal.
    extLinkImgProps.value = imgProps
      ? {
          src: imgProps.lightSrc,
          alt: imgProps.alt,
          dataImgFeature: imgProps.feature,
          dataColorVar: imgProps.colorVar,
          dataSrcMask: imgProps.colorMaskSrc,
        }
      : null;
    extLinkHideQR.value = hideQR;
    extLinkModalRef.value?.show();
  },
);

provide(
  OPEN_QR_CODE_KEY,
  (
    url: string,
    imgProps: FeatureAwareImgProps | null,
    hideOpenLink?: boolean,
  ) => {
    qrUrl.value = url;
    // Convert FeatureAwareImgProps -> HastProperties format for
    // useImgDisplayProps() in QRCodeModal.
    qrImgProps.value = imgProps
      ? {
          src: imgProps.lightSrc,
          alt: imgProps.alt,
          dataImgFeature: imgProps.feature,
          dataColorVar: imgProps.colorVar,
          dataSrcMask: imgProps.colorMaskSrc,
        }
      : null;
    qrHideOpenLink.value = hideOpenLink ?? false;
    qrCodeModalRef.value?.show();
  },
);

// =========================================================================
// Actions
// =========================================================================

// -------------------------------------------------------------------------
// Initialization orchestration
// -------------------------------------------------------------------------

onMounted(async () => {
  try {
    initBootstrapCSSDetection();
    initInputModalityDetection();
    initNoCopyProtection();

    await initLang();

    await nextTick();

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
    page component.
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
  <ToastStack ref="toastStackRef" />
</template>
