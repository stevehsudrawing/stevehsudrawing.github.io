<!--
  SettingsModal.vue — User preferences panel.
  Visibility comes from the shared modal stack (useStackModal).
  Reset button pushes reset-warning on top; Close pops one level;
  backdrop / Esc clears the whole stack.
-->
<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import { useStoredValue } from "../../composables/useStoredValue";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { LANGUAGE_LIST } from "../../configs/language-list";
import { THEME_OPTIONS } from "../../configs/theme-options";
import {
  getStoredEnableAnimations,
  getStoredOpenInNewTab,
  setStoredEnableAnimations,
  setStoredOpenInNewTab,
} from "../../platform/storage";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("settings");
const { push, pop } = useModalStack();

/** Language-select element for keyboard auto-focus. */
const langSelectRef = ref<HTMLElement | null>(null);

const { locale, setLocale } = useI18n();
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
      <BFormCheckbox id="settings-new-tab-toggle" v-model="openInNewTab" switch>
        {{ $t("text-always-open-external-links-in-a-new-tab") }}
      </BFormCheckbox>

      <!-- Animations toggle -->
      <BFormCheckbox
        id="settings-animations-toggle"
        v-model="enableAnimations"
        switch
        :disabled="reducedMotion"
      >
        {{ $t("text-enable-animations") }}
      </BFormCheckbox>
      <small v-if="reducedMotion" class="text-muted d-block mb-3">
        {{ $t("text-animations-disabled-by-system-description") }}
      </small>
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
