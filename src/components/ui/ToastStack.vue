<!--
  ToastStack.vue — Reactive toast notification stack.
  Replaces ui/toast.ts imperative DOM manipulation.
  Exposes showToast() via provide/inject so any descendant component
  can trigger a toast without importing legacy modules.

  Each toast auto-dismisses after TOAST_DURATION_MS (5 s) with a
  progress-bar countdown indicator.
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useBreakpoint } from "../../composables/useBreakpoint";

// =========================================================================
// Constants
// =========================================================================

/** Auto-dismiss duration in milliseconds (5 seconds). */
const TOAST_DURATION_MS = 5000;

/** Max toasts visible at once on small screens (mobile / tablet). */
const MOBILE_MAX_VISIBLE_TOASTS = 1;

/** Max toasts visible at once on large screens (desktop / wide-desktop). */
const DESKTOP_MAX_VISIBLE_TOASTS = 5;

// =========================================================================
// Types
// =========================================================================

/** A single toast notification in the stack. */
interface ToastEntry {
  id: number;
  type: "success" | "error";
  message: string;
}

// =========================================================================
// State
// =========================================================================

let nextId = 1;
const toasts = ref<ToastEntry[]>([]);

/** Shared viewport breakpoint — drives the visible-toast cap. */
const breakpoint = useBreakpoint();

/**
 * Max toasts shown at once: 1 on mobile/tablet, 5 on larger screens.
 * Overflow toasts stay in the stack (their own 5 s timer still dismisses
 * them and fires `@hidden`) but are hidden via `.toast-overflow`.
 */
const maxVisibleToasts = computed(() =>
  breakpoint.value === "mobile" || breakpoint.value === "tablet"
    ? MOBILE_MAX_VISIBLE_TOASTS
    : DESKTOP_MAX_VISIBLE_TOASTS,
);

// =========================================================================
// Actions
// =========================================================================

/**
 * Show a toast notification.  The toast auto-dismisses after
 * TOAST_DURATION_MS with a progress-bar countdown.
 * @param type - 'success' (green) or 'error' (red).
 * @param message - Text to display in the toast body.
 */
function showToast(type: "success" | "error", message: string): void {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, type, message }];
}

/**
 * Remove a toast from the stack by id.
 * @param id - The unique id assigned when the toast was created.
 */
function removeToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

/**
 * Whether a toast (by render index) exceeds the visible cap and should be
 * hidden.  Newest toasts are appended last, so the newest N stay visible
 * and the older ones are hidden.
 * @param index - The toast's index in the rendered list.
 */
function isOverflowToast(index: number): boolean {
  return index < toasts.value.length - maxVisibleToasts.value;
}

// =========================================================================
// Expose
// =========================================================================

defineExpose({ showToast });
</script>

<template>
  <div
    v-if="toasts.length > 0"
    id="toast-container"
    class="toast-container position-fixed bottom-0 end-0 p-3"
    aria-live="polite"
    aria-atomic="true"
  >
    <TransitionGroup name="toast-slide">
      <BToast
        v-for="(t, index) in toasts"
        :key="t.id"
        :model-value="TOAST_DURATION_MS"
        :variant="t.type === 'error' ? 'danger' : 'success'"
        :progress-props="{
          variant: t.type === 'error' ? 'danger' : 'success',
        }"
        :class="{ 'toast-overflow': isOverflowToast(index) }"
        solid
        @hidden="removeToast(t.id)"
      >
        {{ t.message }}
      </BToast>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* --- Toast slide-in/out transition --- */

.toast-slide-enter-active {
  transition: all 0.3s ease-out;
}

.toast-slide-leave-active {
  transition: all 0.2s ease-in;
}

.toast-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* --- Toast Tweaks  --- */

/* Overflow toasts: kept in the stack (their auto-dismiss timer still runs
   and removes them) but not rendered on screen.  `!important` is required —
   BToast sets an inline `display: block` during its enter animation, which
   would otherwise beat this class rule. */
.toast-overflow {
  display: none !important;
}

:deep(.progress-bar) {
  transition: width 0s linear;
}

:deep(.btn-close-custom) {
  margin-top: auto;
  margin-bottom: auto;
  margin-right: 0.2rem;
}

:deep(.btn-close) {
  filter: invert(1) grayscale(100);
}
</style>
