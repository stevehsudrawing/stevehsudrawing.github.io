<!--
  SequenceStatusBar.vue — Fixed bottom "system log" bar for the About-page
  easter egg.  Driven by the shared useMajorColorSequence singleton:
  "detecting" shows "> Sequence detected"; "error" shows
  "> Sequence error — authentication failed" for 3 s then hides; a 5 s
  inactivity timeout hides it too.  Text is deliberately NOT i18n (like
  the sticker-modal title) — a language-neutral terminal log line.

  Fixed positioning keeps it out of the document flow → zero CLS.  While
  visible, a `sequence-bar-visible` class on <html> shifts the toast
  container up (base.css) so toasts do not overlap the bar.
-->
<script setup lang="ts">
import { computed, onScopeDispose, watch } from "vue";
import { useMajorColorSequence } from "../../composables/useMajorColorSequence";

// =========================================================================
// State
// =========================================================================

const { status } = useMajorColorSequence();

/**
 * The bar message — terminal English, language-neutral (not i18n), like
 * the sticker-modal title.
 */
const message = computed(() =>
  status.value === "error"
    ? "> Sequence error — authentication failed"
    : "> Sequence detected",
);

// ---- Toast-overlap coordination: shift the toast container up ----

watch(
  status,
  (value) => {
    document.documentElement.classList.toggle(
      "sequence-bar-visible",
      value !== "idle",
    );
  },
  { immediate: true },
);

onScopeDispose(() => {
  document.documentElement.classList.remove("sequence-bar-visible");
});
</script>

<template>
  <div
    v-if="status !== 'idle'"
    class="sequence-status-bar no-copy"
    role="status"
    aria-live="polite"
  >
    <code
      class="code-no-bg sequence-status-message"
      :class="{ 'text-danger': status === 'error' }"
      >{{ message }}</code
    >
  </div>
</template>

<style scoped>
/* ==== Sequence status bar — fixed bottom "system log" line ==== */

.sequence-status-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1020;
  display: flex;
  align-items: center;
  height: 2.5rem;
  padding: 0 1rem;
  border-top: 1px solid var(--bs-border-color);
  background-color: var(--bs-tertiary-bg);
  font-family: var(--shlh-font-monospace-en, monospace);
  color: var(--bs-body-color);
  opacity: 0.9;
}

.sequence-status-message {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
