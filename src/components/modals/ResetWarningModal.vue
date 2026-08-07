<!--
  ResetWarningModal.vue -- Confirmation dialog before clearing all preferences.
  Replaces the nested #warning-reset-modal from build/page-components/modals.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import { useModalFocus } from "../../composables/useModalFocus";

// =========================================================================
// Props
// =========================================================================

/**
 * Emits for ResetWarningModal.
 *
 * - confirm: User confirmed reset -- parent (SettingsModal) clears all
 *   preferences and redirects to the homepage.
 * - cancel: User cancelled -- parent re-shows the SettingsModal.
 */
const emit = defineEmits<{
  (e: "confirm"): void;
  (e: "cancel"): void;
}>();

// =========================================================================
// State
// =========================================================================

const visible = ref(false);

/** Cancel-button element for keyboard auto-focus. */
const cancelBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Cancel button when opened via Tab. */
const { onShown } = useModalFocus(cancelBtnRef);

// =========================================================================
// Expose
// =========================================================================

/** Expose show/hide for imperative callers (SettingsModal). */
defineExpose({
  show: () => {
    visible.value = true;
  },
  hide: () => {
    visible.value = false;
  },
});
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
          @click="
            visible = false;
            emit('cancel');
          "
        >
          {{ $t("text-cancel", "Cancel") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-danger btn-no-border"
          @click="
            visible = false;
            emit('confirm');
          "
        >
          {{ $t("text-continue", "Continue") }}
        </button>
      </div>
    </template>
  </BModal>
</template>
