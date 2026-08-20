<!--
  SequenceStatusBar.vue — Fixed bottom "system log" bar for the About-page
  easter egg.  Driven by the shared useMajorColorSequence singleton.
  Shows a terminal-style progress line as the color sequence is entered:

    detecting: > [==  ] Sequence detected
    success:   > [====] Authentication successful  (.text-success, 3 s)
    error:     > [    ] Authentication failed      (.text-danger, 3 s)

  A 5 s inactivity timeout hides the bar too.  Text is deliberately NOT
  i18n (like the sticker-modal title) — a language-neutral terminal log
  line.  The bar slides up/down via a <Transition>; fixed positioning
  keeps it out of the document flow → zero CLS.  While visible, a
  `sequence-bar-visible` class on <html> shifts the toast container up
  (base.css) so toasts do not overlap the bar.
-->
<script setup lang="ts">
import { computed, onScopeDispose, watch } from "vue";
import {
  SEQUENCE_LENGTH,
  useMajorColorSequence,
} from "../../composables/useMajorColorSequence";

// =========================================================================
// State
// =========================================================================

const { status, progress } = useMajorColorSequence();

/**
 * Terminal progress cells, e.g. `==  ` for 2 of SEQUENCE_LENGTH signals.
 * Filled `=` count comes from the composable's `progress` (0 for idle /
 * error, full for success).
 */
const progressCells = computed(() => {
  const filled = Math.min(progress.value, SEQUENCE_LENGTH);
  return "=".repeat(filled) + "-".repeat(SEQUENCE_LENGTH - filled);
});

/**
 * The bar line — terminal English, language-neutral (not i18n), like the
 * sticker-modal title.
 */
const message = computed(() => {
  const cells = progressCells.value;
  switch (status.value) {
    case "error":
      return `> [${cells}] Authentication failed`;
    case "success":
      return `> [${cells}] Authentication successful`;
    default:
      return `> [${cells}] Sequence detected`;
  }
});

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
  <Transition name="sequence-status-bar">
    <div
      v-if="status !== 'idle'"
      class="sequence-status-bar no-copy"
      role="status"
      aria-live="polite"
    >
      <div class="container">
        <code
          class="code-no-bg sequence-status-message"
          :class="{
            'text-danger': status === 'error',
            'text-success': status === 'success',
          }"
          >{{ message }}</code
        >
      </div>
    </div>
  </Transition>
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
  background-color: rgba(var(--bs-body-bg-rgb), 0.8);
  backdrop-filter: blur(1rem);
  color: var(--bs-body-color);
  box-shadow: var(--bs-box-shadow-lg);
  z-index: 1055;
}

.sequence-status-message {
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- Show/hide animation (slide up from / down to below the viewport) --- */

.sequence-status-bar-enter-active,
.sequence-status-bar-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.sequence-status-bar-enter-from,
.sequence-status-bar-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
