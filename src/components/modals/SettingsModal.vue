<!--
  SettingsModal.vue — User preferences panel.
  Visibility comes from the shared modal stack (useStackModal).
  Reset button pushes reset-warning on top; Close pops one level;
  backdrop / Esc clears the whole stack.
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { useStoredValue } from "../../composables/useStoredValue";
import { useSwiperMode } from "../../composables/useSwiperMode";
import { useTheme } from "../../composables/useTheme";
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
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("settings");
const { push, pop } = useModalStack();

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

/** Tooltip text of the animations toggle icon (warning ⇄ info). */
const animationsTooltip = computed(() =>
  reducedMotion.value
    ? t("text-animations-disabled-by-system-description")
    : t("text-enable-animations-description"),
);

/** Tooltip text of the Swiper toggle icon (warning ⇄ info). */
const swiperTooltip = computed(() =>
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

/**
 * No-op click guard for the toggle tooltip icons: with the `stop` /
 * `prevent` modifiers it keeps a click on the icon (inside the checkbox
 * label) from toggling the switch.
 */
function blockToggle(): void {}

/** Open ResetWarningModal on top of this modal (via the modal stack). */
function openResetWarning(): void {
  push({ id: "reset-warning", props: null });
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
      <div>
        <label for="settings-language-select" class="form-label fw-semibold">
          {{ $t("text-language") }}
        </label>
        <select
          id="settings-language-select"
          ref="langSelectRef"
          v-model="locale"
          class="form-select"
          @change="setLocale(locale)"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.code">
            {{ lang.name }}
          </option>
        </select>
      </div>

      <!-- Theme -->
      <div>
        <div class="mb-2 fw-semibold">{{ $t("text-theme") }}</div>
        <div class="btn-group d-flex flex-wrap" role="group">
          <button
            v-for="t in THEME_OPTIONS"
            :key="t.value"
            type="button"
            class="btn btn-outline-secondary flex-fill"
            :class="{ active: themePreference === t.value }"
            @click="setTheme(t.value)"
          >
            {{ $t(t.i18nKey) }}
          </button>
        </div>
      </div>

      <!-- New-tab toggle -->
      <BFormCheckbox
        id="settings-new-tab-toggle"
        v-model="openInNewTab"
        :unchecked-value="false"
        switch
      >
        {{ $t("text-always-open-external-links-in-a-new-tab") }}
      </BFormCheckbox>

      <!-- Animations toggle -->
      <BFormCheckbox
        id="settings-animations-toggle"
        v-model="enableAnimations"
        :unchecked-value="false"
        switch
        :disabled="reducedMotion"
      >
        {{ $t("text-enable-animations") }}
        <TooltipTrigger :title="animationsTooltip" :delay="0" teleport>
          <i
            class="bi ms-1"
            :class="
              reducedMotion ? 'bi-exclamation-triangle' : 'bi-info-circle'
            "
            role="img"
            tabindex="0"
            :aria-label="animationsTooltip"
            @click.stop.prevent="blockToggle"
          ></i>
        </TooltipTrigger>
      </BFormCheckbox>

      <!-- Swiper toggle -->
      <BFormCheckbox
        id="settings-swiper-toggle"
        v-model="swiperToggle"
        :unchecked-value="false"
        switch
        :disabled="!swiperSupported"
      >
        {{ $t("text-enable-swiper") }}
        <TooltipTrigger :title="swiperTooltip" :delay="0" teleport>
          <i
            class="bi ms-1"
            :class="
              swiperSupported ? 'bi-info-circle' : 'bi-exclamation-triangle'
            "
            role="img"
            tabindex="0"
            :aria-label="swiperTooltip"
            @click.stop.prevent="blockToggle"
          ></i>
        </TooltipTrigger>
      </BFormCheckbox>
    </div>

    <!-- Reset confirmation: pushed onto the stack by openResetWarning() -->
    <template #footer>
      <div class="w-100 d-flex justify-content-between">
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="openResetWarning"
        >
          {{ $t("text-reset") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="pop()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>
