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
import { useStoredValue } from "./composables/useStoredValue";
import { usePageNavigation } from "./composables/usePageNavigation";
import { useModalStack } from "./composables/useModalStack";
import { SHOW_TOAST_KEY } from "./composables/useToast";

// UI components (template refs)
import SettingsModal from "./components/modals/SettingsModal.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";
import ResetWarningModal from "./components/modals/ResetWarningModal.vue";
import GitHubEventsModal from "./components/modals/GitHubEventsModal.vue";
import PictureViewerModal from "./components/modals/PictureViewerModal.vue";
import LoadingScreen from "./components/ui/LoadingScreen.vue";
import LoadingBar from "./components/ui/LoadingBar.vue";
import SkipButton from "./components/buttons/SkipButton.vue";
import AppNavbar from "./components/nav/AppNavbar.vue";
import FooterNav from "./components/nav/FooterNav.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Platform-level modules
import {
  OPEN_EXTERNAL_LINK_KEY,
  OPEN_QR_CODE_KEY,
  OPEN_SETTINGS_KEY,
} from "./types/app";
import type { FeatureAwarePictureProps, ColoredImgProps } from "./types/app";

import {
  getStoredEnableAnimations,
  getStoredOpenInNewTab,
  setStoredEnableAnimations,
  setStoredOpenInNewTab,
} from "./platform/storage";

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
const { initLang, messages, t } = useI18n();
useStoredValue(getStoredOpenInNewTab, setStoredOpenInNewTab, true);
const enableAnimations = useStoredValue(
  getStoredEnableAnimations,
  setStoredEnableAnimations,
  true,
);

// ---- Sync .no-animations class to <html> ----

watch(
  enableAnimations,
  (val) => {
    document.documentElement.classList.toggle("no-animations", !val);
  },
  { immediate: true },
);

/** Vue Router instance (for guards + programmatic navigation). */
const router = useRouter();

/** Current route (reactive — drives Navbar active state). */
const route = useRoute();
const currentPage = computed(() => normalizeInternalPath(route.path));

/** Template refs for imperative show/hide via defineExpose. */
const loadingScreenRef = ref<InstanceType<typeof LoadingScreen>>();
const loadingBarRef = ref<InstanceType<typeof LoadingBar>>();
const toastStackRef = ref<InstanceType<typeof ToastStack>>();

// ---- Router guards (LoadingBar, dimming, indicators, title, ?lang=) ----

usePageNavigation(router, loadingBarRef, t);

// ---- Modal stack (all modals coordinate through the shared stack) ----

const { push } = useModalStack();

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
  push({ id: "settings", props: null });
});

// ---- External-link & QR-code injection (consumed by TypeAwareLink, QRCodeButton) ----

provide(
  OPEN_EXTERNAL_LINK_KEY,
  (
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
    hideQR: boolean,
  ) => {
    push({
      id: "external-link",
      props: { url, pictureProps, coloredProps, hideQR },
    });
  },
);

provide(
  OPEN_QR_CODE_KEY,
  (
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
    hideOpenLink?: boolean,
  ) => {
    push({
      id: "qr-code",
      props: {
        url,
        pictureProps,
        coloredProps,
        hideOpenLink: hideOpenLink ?? false,
      },
    });
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
    initLang();
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
    Modals: mounted here, each reads its props + visibility from the
    shared modal stack (useStackModal).
  -->
  <SettingsModal />
  <ExternalLinkConfirmModal />
  <QRCodeModal />
  <ResetWarningModal />
  <GitHubEventsModal />
  <PictureViewerModal />
  <ToastStack ref="toastStackRef" />
</template>
