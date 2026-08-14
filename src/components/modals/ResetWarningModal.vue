<!--
  ResetWarningModal.vue — Confirmation dialog before clearing all
  preferences.  Visibility comes from the shared modal stack.
  Cancel pops back to SettingsModal; Continue resets and clears
  the stack (then redirects to the homepage).
-->
<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useTheme } from "../../composables/useTheme";
import { useLocalStorage } from "../../composables/useLocalStorage";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { StorageKey } from "../../types/app";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("reset-warning");
const { pop, clear } = useModalStack();

const { locale, setLocale } = useI18n();
const { setPreference: setTheme } = useTheme();
const openInNewTab = useLocalStorage(StorageKey.OpenInNewTab, true);
const enableAnimations = useLocalStorage(StorageKey.EnableAnimations, true);

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
    :title="$t('text-warning', 'Warning')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <p>
      {{
        $t(
          "text-warning-reset-description",
          "If you choose to continue, this will clear your preferences, including language and color scheme settings. After clearing, you will be redirected to the homepage.",
        )
      }}
    </p>

    <template #footer>
      <div class="w-100 d-flex justify-content-between">
        <button
          ref="cancelBtnRef"
          type="button"
          class="btn btn-outline-secondary btn-no-border"
          @click="pop()"
        >
          {{ $t("text-cancel", "Cancel") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="resetAll()"
        >
          {{ $t("text-continue", "Continue") }}
        </button>
      </div>
    </template>
  </BModal>
</template>
