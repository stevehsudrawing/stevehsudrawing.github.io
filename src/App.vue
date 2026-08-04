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
import { SHOW_TOAST_KEY } from "./composables/useToast";

// UI components (template refs)
import SettingsModal from "./components/modals/SettingsModal.vue";
import ExternalLinkConfirmModal from "./components/modals/ExternalLinkConfirmModal.vue";
import QRCodeModal from "./components/modals/QRCodeModal.vue";
import LoadingScreen from "./components/ui/LoadingScreen.vue";
import LoadingBar from "./components/ui/LoadingBar.vue";
import ScrollHint from "./components/ui/ScrollHint.vue";
import CopyProtectedImg from "./components/ui/CopyProtectedImg.vue";
import AppNavbar from "./components/layout/AppNavbar.vue";
import FooterNav from "./components/layout/FooterNav.vue";
import ToastStack from "./components/ui/ToastStack.vue";

// Legacy modules (diminishing — Phase 7 will eliminate most)
import { StorageKey } from "./types/app";
import {
  initThemeTransitionOverlay,
  updateThemeToggleText,
  setActiveThemeItem,
} from "./ui/theme";
import { initBootstrapCSSDetection } from "./ui/bootstrap-css-detection";
import { initHashChangeScroll, initSkipButton } from "./ui/accessibility";
import { normalizeInternalPath } from "./core/utils";

// =========================================================================
// State
// =========================================================================

useTheme();
const { syncFromLangData, initLang, isLanguageLoading } = useI18n();
useLocalStorage(StorageKey.OpenInNewTab, true);
useLocalStorage(StorageKey.EnableAnimations, true);

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
const scrollHintRef = ref<InstanceType<typeof ScrollHint>>();
const copyProtectedImgRef = ref<InstanceType<typeof CopyProtectedImg>>();
const appNavbarRef = ref<InstanceType<typeof AppNavbar>>();
const toastStackRef = ref<InstanceType<typeof ToastStack>>();

// ---- Router guards (LoadingBar integration) ----

router.beforeEach(() => {
  loadingBarRef.value?.show();
});
router.afterEach(() => {
  loadingBarRef.value?.complete();
});

/**
 * Preserve `?lang=` query parameter across navigations.
 * When navigating from a page that has ?lang=zh-Hans, the target
 * page should also receive ?lang=zh-Hans.
 */
router.beforeEach((to, from) => {
  const langParam = from.query.lang;
  if (langParam && !to.query.lang) {
    return { ...to, query: { ...to.query, lang: langParam } };
  }
  return true;
});

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
    initThemeTransitionOverlay();
    initSkipButton();

    await initLang();

    // Sync the Vue plugin's messages ref from the legacy langData global,
    // so that $t() in Vue templates returns translated text (not just fallbacks).
    await syncFromLangData();

    // Vue-based event delegation
    document.addEventListener("click", onSettingsOpen);
    document.addEventListener("click", onExternalLinkClick);
    document.addEventListener("click", onQRTrigger);
    document.addEventListener("click", onInternalLinkClick);

    initHashChangeScroll();

    updateThemeToggleText();
    setActiveThemeItem();

    loadingScreenRef.value?.hide();
  } catch (error) {
    console.error("Failed to initialize: " + error);
    loadingScreenRef.value?.hide();
  }
});

// -------------------------------------------------------------------------
// Toast listener (migrated from ui/toast.ts — copy-link.ts dispatches
// "toast-show" CustomEvent for clipboard feedback)
// -------------------------------------------------------------------------

document.addEventListener("toast-show", ((e: CustomEvent) => {
  const { type, message } = e.detail as {
    type: "success" | "error";
    message: string;
  };
  toastStackRef.value?.showToast(type, message);
}) as EventListener);
</script>

<template>
  <!--
    Static overlay elements.  Live outside the main flow (fixed-positioned)
    but are rendered here so they are guaranteed to exist at page load.
  -->
  <div class="theme-transition-overlay"></div>
  <a
    id="skip-button"
    href="#page-content"
    class="btn btn-primary"
    role="button"
    >{{ $t("text-skip-to-content", "Skip to Content") }}</a
  >

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
  <ScrollHint ref="scrollHintRef" />
  <CopyProtectedImg ref="copyProtectedImgRef" />
  <ToastStack ref="toastStackRef" />
</template>
