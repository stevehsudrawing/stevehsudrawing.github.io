<!--
  ModalTrigger.vue — HAST element that opens a parameterless modal.

  Rendered by HastFragment for elements carrying the `dataModal`
  property (whose value is a parameterless modal id).  Renders a
  semantic <button> styled with the `.link` underline sweep; an
  unknown id warns once and falls back to a plain <span> so the
  content never disappears.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useSkinViewerModal } from "../../composables/modals/useSkinViewerModal";

// =========================================================================
// Types
// =========================================================================

/** Openers for every parameterless modal a `dataModal` may target. */
const MODAL_OPENERS: Readonly<Record<string, () => void>> = {
  "skin-viewer": useSkinViewerModal().openSkinViewerModal,
};

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Parameterless modal id from the `dataModal` HAST property. */
  modalId: string;
}>();

// =========================================================================
// State
// =========================================================================

/** Warned ids — one console.warn per unknown id. */
const warnedIds = new Set<string>();

/** Whether the id resolves to a registered opener. */
const known = computed(
  () => typeof MODAL_OPENERS[props.modalId] === "function",
);

// =========================================================================
// Actions
// =========================================================================

/** Opens the configured modal (unknown ids warn once and do nothing). */
function onClick(): void {
  const opener = MODAL_OPENERS[props.modalId];
  if (!opener) {
    if (!warnedIds.has(props.modalId)) {
      warnedIds.add(props.modalId);
      console.warn(`ModalTrigger: unknown modal id "${props.modalId}"`);
    }
    return;
  }
  opener();
}
</script>

<template>
  <button
    v-if="known"
    type="button"
    class="link modal-trigger"
    @click="onClick"
  >
    <slot />
  </button>
  <span v-else><slot /></span>
</template>

<style scoped>
/* Button reset — the trigger reads as an inline text link and leans on
   the shared `.link` underline sweep. */
.modal-trigger {
  display: inline;
  border: 0;
  padding: 0;
  background: none;
  font: inherit;
  color: var(--bs-link-color);
  cursor: pointer;
  text-align: inherit;
}

.modal-trigger:hover {
  color: var(--bs-link-hover-color);
}
</style>
