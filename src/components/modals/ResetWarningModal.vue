<!--
  ResetWarningModal.vue — Confirmation dialog before clearing all
  preferences.  Visibility comes from the shared modal stack.
  Cancel pops back to SettingsModal; Continue resets and clears
  the stack (then redirects to the homepage).
-->
<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { useStoredValue } from "../../composables/useStoredValue";
import { useTheme } from "../../composables/useTheme";
import {
  getStoredEnableAnimations,
  getStoredOpenInNewTab,
  setStoredEnableAnimations,
  setStoredOpenInNewTab,
} from "../../platform/storage";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("reset-warning");
const { pop, clear } = useModalStack();

const { locale, setLocale } = useI18n();
const { setPreference: setTheme } = useTheme();
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

/** Cancel-button element for keyboard auto-focus. */
const cancelBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Cancel button when opened via Tab. */
const { onShown } = useModalFocus(cancelBtnRef);

// =========================================================================
// Actions
// =========================================================================

/** Clear all preferences, dismiss the stack, redirect to the homepage. */
function resetAll(): void {
  openInNewTab.value = true;
  enableAnimations.value = true;
  setTheme("auto");
  locale.value = "en";
  setLocale("en");
  clear();
  window.location.href = "/index.html";
}
</script>

<template>
  <BModal
    v-model="visible"
    :title="$t('text-warning')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <p>
      {{ $t("text-warning-reset-description") }}
    </p>

    <template #footer>
      <div class="w-100 d-flex justify-content-between">
        <button
          ref="cancelBtnRef"
          type="button"
          class="btn btn-outline-secondary btn-no-border"
          @click="pop()"
        >
          {{ $t("text-cancel") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="resetAll()"
        >
          {{ $t("text-continue") }}
        </button>
      </div>
    </template>
  </BModal>
</template>
