<!--
  App.vue — Vue application root shell.
  Handles initialization orchestration that was previously in
  main.ts's DOMContentLoaded handler.
-->
<script setup lang="ts">
import { computed, nextTick, onMounted, provide, ref, watch } from "vue";

// =========================================================================
// Imports
// =========================================================================

// Vue Router
import { useRoute, useRouter } from "vue-router";

// Composables
import { useI18n } from "./composables/useI18n";
import { useModalStack } from "./composables/useModalStack";
import { usePageNavigation } from "./composables/usePageNavigation";
import { useStoredValue } from "./composables/useStoredValue";
import { useTheme } from "./composables/useTheme";
import { SHOW_TOAST_KEY } from "./composables/useToast";

// UI components (template refs)
import SkipButton from "./components/buttons/SkipButton.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import GitHubEventsModal from "./components/modals/GitHubEventsModal.vue";
import PictureViewerModal from "./components/modals/PictureViewerModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";
import ResetWarningModal from "./components/modals/ResetWarningModal.vue";
import SettingsModal from "./components/modals/SettingsModal.vue";
import StickerModal from "./components/modals/StickerModal.vue";
import AppNavbar from "./components/nav/AppNavbar.vue";
import FooterNav from "./components/nav/FooterNav.vue";
import LoadingBar from "./components/ui/LoadingBar.vue";
import LoadingScreen from "./components/ui/LoadingScreen.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Platform-level modules
import type { TypeAwareImageProps } from "./types/app";
import {
  OPEN_EXTERNAL_LINK_KEY,
  OPEN_QR_CODE_KEY,
  OPEN_SETTINGS_KEY,
  OPEN_STICKER_KEY,
} from "./types/app";

import {
  getStoredEnableAnimations,
  getStoredOpenInNewTab,
  setStoredEnableAnimations,
  setStoredOpenInNewTab,
} from "./platform/storage";

import { STICKER_TRIGGER_HASHES } from "./configs/easter-egg";
import { normalizeInternalPath } from "./core/utils";
import {
  initHashChangeScroll,
  initInputModalityDetection,
} from "./platform/accessibility";
import { initBootstrapCSSDetection } from "./platform/bootstrap-css-detection";
import { initNoCopyProtection } from "./platform/no-copy";

// =========================================================================
// State
// =========================================================================

useTheme();
const { initLang, t, locale, setLocale } = useI18n();
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
  (url: string, icon: TypeAwareImageProps | null, hideQR: boolean) => {
    push({
      id: "external-link",
      props: { url, icon, hideQR },
    });
  },
);

provide(
  OPEN_QR_CODE_KEY,
  (url: string, icon: TypeAwareImageProps | null, hideOpenLink?: boolean) => {
    push({
      id: "qr-code",
      props: {
        url,
        icon,
        hideOpenLink: hideOpenLink ?? false,
      },
    });
  },
);

// ---- Sticker-modal injection (consumed by AboutPage) ----

provide(OPEN_STICKER_KEY, () => {
  push({ id: "sticker", props: null });
});

// ---- Secret-hash sticker trigger (#47c4ee / #3c96ff) ----

/**
 * Open the sticker modal directly when the URL hash is one of the two
 * major colors (shareable easter-egg link), then clear the hash so a
 * refresh does not re-trigger and the router does not try to scroll to
 * it.  The modal's @shown handler fires the confetti burst as usual.
 *
 * `route.hash` includes the leading "#" (e.g. "#47c4ee"), so it is
 * compared directly against STICKER_TRIGGER_HASHES.
 */
watch(
  () => route.hash,
  (hash) => {
    if (STICKER_TRIGGER_HASHES.includes(hash)) {
      push({ id: "sticker", props: null });
      void router.replace({ hash: "" });
    }
  },
  { immediate: true },
);

// ---- Sync ?lang= query changes to the active language ----

/**
 * Internal links that change only the language (e.g. the worldview page's
 * cross-language links) navigate without a page reload.  Apply the new
 * `?lang=` instead of leaving the URL and the active language out of sync.
 * The dropdown path is unaffected (setLocale writes the URL via
 * history.replaceState, which does not change `route.query`).
 */
watch(
  () => route.query.lang,
  (lang) => {
    if (typeof lang === "string" && lang !== locale.value) {
      setLocale(lang);
    }
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
  <StickerModal />
  <ToastStack ref="toastStackRef" />
</template>
