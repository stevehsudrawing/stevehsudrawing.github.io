<!--
  SettingsModal.vue — User preferences panel, shaped as mobile-style
  option rows (title + persistent description left, control right).
  Visibility comes from the shared modal stack (useStackModal).
  Reset button opens reset-warning on top; Close pops one level;
  backdrop / Esc clears the whole stack.

  Forced states (system reduced motion / unsupported browser) swap in a
  forced-disabled description and a purely decorative warning icon left
  of the control.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import { useStoredValue } from "../../composables/core/useStoredValue";
import { useSwiperMode } from "../../composables/core/useSwiperMode";
import { useTheme } from "../../composables/core/useTheme";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { useResetWarningModal } from "../../composables/modals/useResetWarningModal";
import { LANGUAGE_LIST } from "../../configs/language-list";
import { THEME_OPTIONS } from "../../configs/theme-options";
import {
  getStoredEnableAnimations,
  getStoredEnableSwiper,
  getStoredOpenInNewTab,
  setStoredEnableAnimations,
  setStoredEnableSwiper,
  setStoredOpenInNewTab,
} from "../../platform/storage";
import MaterialSymbol from "../icons/MaterialSymbol.vue";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("settings");
const { pop } = useModalStack();
const { openResetWarningModal } = useResetWarningModal();

/** Language-select element for keyboard auto-focus. */
const langSelectRef = ref<HTMLElement | null>(null);

const { locale, setLocale, t } = useI18n();
const { preference: themePreference, setPreference: setTheme } = useTheme();

const openInNewTab = useStoredValue(
  getStoredOpenInNewTab,
  setStoredOpenInNewTab,
  true,
);
const enableAnimations = useStoredValue(
  getStoredEnableAnimations,
  setStoredEnableAnimations,
  true,
);
const enableSwiper = useStoredValue(
  getStoredEnableSwiper,
  setStoredEnableSwiper,
  true,
);

/**
 * Browser capability probe for the Swiper toggle — below-baseline
 * browsers show the switch disabled (see `useSwiperMode`).
 */
const { swiperSupported } = useSwiperMode();

/**
 * Display binding of the Swiper switch: OFF whenever the browser cannot
 * run Swiper; the stored preference is written only while supported
 * (a disabled switch never calls the setter anyway).
 */
const swiperToggle = computed({
  get: () => swiperSupported && enableSwiper.value,
  set: (value: boolean) => {
    if (swiperSupported) enableSwiper.value = value;
  },
});

/** Keyboard-aware focus: move focus to language select when opened via Tab. */
const { onShown } = useModalFocus(langSelectRef);

// -------------------------------------------------------------------------
// Reduced-motion detection
// -------------------------------------------------------------------------

const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const reducedMotion = ref(reducedMotionQuery.matches);
function onReducedMotionChange(): void {
  reducedMotion.value = reducedMotionQuery.matches;
}
reducedMotionQuery.addEventListener("change", onReducedMotionChange);
onBeforeUnmount(() => {
  reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
});

/** Persistent description of the animations row (forced state ⇄ normal). */
const animationsDescription = computed(() =>
  reducedMotion.value
    ? t("text-animations-disabled-by-system-description")
    : t("text-enable-animations-description"),
);

/** Persistent description of the Swiper row (forced state ⇄ normal). */
const swiperDescription = computed(() =>
  swiperSupported
    ? t("text-enable-swiper-description")
    : t("text-swiper-unsupported-description"),
);

// -------------------------------------------------------------------------
// Theme / language options
// -------------------------------------------------------------------------

const languages = LANGUAGE_LIST.map((item) => ({
  code: item.code,
  name: item.localizedName,
}));

// =========================================================================
// Actions
// =========================================================================

/** Open ResetWarningModal on top of this modal (via its opener). */
function openResetWarning(): void {
  openResetWarningModal();
}
</script>

<template>
  <!-- ==== Settings Modal ==== -->
  <BModal
    v-model="visible"
    :title="$t('text-settings')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    ok-only
    ok-title="Close"
    ok-variant="outline-primary"
    cancel-variant="outline-secondary"
    @shown="onShown"
  >
    <div class="d-flex flex-column gap-3">
      <!-- Language -->
      <div class="settings-row">
        <label class="settings-text" for="settings-language-select">
          {{ $t("text-language") }}
        </label>
        <div class="settings-control">
          <select
            id="settings-language-select"
            ref="langSelectRef"
            v-model="locale"
            class="form-select settings-select"
            @change="setLocale(locale)"
          >
            <option
              v-for="lang in languages"
              :key="lang.code"
              :value="lang.code"
            >
              {{ lang.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Theme -->
      <div class="settings-row">
        <label class="settings-text" for="settings-theme-select">
          {{ $t("text-theme") }}
        </label>
        <div class="settings-control">
          <select
            id="settings-theme-select"
            v-model="themePreference"
            class="form-select settings-select"
            @change="setTheme(themePreference)"
          >
            <option
              v-for="option in THEME_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ $t(option.i18nKey) }}
            </option>
          </select>
        </div>
      </div>

      <!-- New-tab toggle -->
      <BFormCheckbox
        id="settings-new-tab-toggle"
        v-model="openInNewTab"
        :unchecked-value="false"
        :aria-label="$t('text-always-open-external-links-in-a-new-tab')"
        switch
        class="settings-row settings-row-switch"
      >
        <span class="settings-text">
          {{ $t("text-always-open-external-links-in-a-new-tab") }}
        </span>
      </BFormCheckbox>

      <!-- Animations toggle -->
      <BFormCheckbox
        id="settings-animations-toggle"
        v-model="enableAnimations"
        :unchecked-value="false"
        :disabled="reducedMotion"
        :aria-label="$t('text-enable-animations')"
        switch
        class="settings-row settings-row-switch"
      >
        <span class="settings-text">
          {{ $t("text-enable-animations") }}
          <span class="small text-body-secondary">
            {{ animationsDescription }}
          </span>
        </span>
        <MaterialSymbol
          v-if="reducedMotion"
          name="warning"
          class="settings-warning text-body"
        />
      </BFormCheckbox>

      <!-- Swiper toggle -->
      <BFormCheckbox
        id="settings-swiper-toggle"
        v-model="swiperToggle"
        :unchecked-value="false"
        :disabled="!swiperSupported"
        :aria-label="$t('text-enable-swiper')"
        switch
        class="settings-row settings-row-switch"
      >
        <span class="settings-text">
          {{ $t("text-enable-swiper") }}
          <span class="small text-body-secondary">{{ swiperDescription }}</span>
        </span>
        <MaterialSymbol
          v-if="!swiperSupported"
          name="warning"
          class="settings-warning text-body"
        />
      </BFormCheckbox>
    </div>

    <!-- Reset confirmation: pushed onto the stack by openResetWarning() -->
    <template #footer>
      <div class="w-100 d-flex">
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="openResetWarning"
        >
          {{ $t("text-reset") }}
        </button>
        <div class="ms-auto">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            @click="pop()"
          >
            {{ $t("text-close") }}
          </button>
        </div>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* ==== Settings Modal — mobile-style option rows ==== */

/* --- Row layout --- */

.settings-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1 1 auto;
  min-width: 0;
}

.settings-control {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

/* --- Selects: borderless with a hover tint --- */

.settings-select {
  width: auto;
  border: 0;
  background-color: transparent;
  transition: background-color var(--shlh-duration-fast) ease-in-out;
}

.settings-select:hover {
  background-color: rgba(var(--bs-body-color-rgb), 0.1);
}

/* --- Switch rows (BFormCheckbox re-flowed into the row) --- */

.settings-row-switch {
  margin: 0;
  padding: 0;
  cursor: pointer;
}

.settings-row-switch :deep(.form-check-label) {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-width: 0;
}

.settings-row-switch :deep(.form-check-input) {
  order: 2;
  float: none;
  flex: 0 0 auto;
  margin: 0;
}

.settings-warning {
  flex-shrink: 0;
}
</style>
