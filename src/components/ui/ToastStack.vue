<!--
  ToastStack.vue -- Reactive toast notification stack.
  Replaces ui/toast.ts imperative DOM manipulation.
  Exposes showToast() via provide/inject so any descendant component
  can trigger a toast without importing legacy modules.

  Each toast auto-dismisses after TOAST_DURATION_MS (5 s) with a
  progress-bar countdown indicator.
-->
<script setup lang="ts">
import { ref } from "vue";

// =========================================================================
// Constants
// =========================================================================

/** Auto-dismiss duration in milliseconds (5 seconds). */
const TOAST_DURATION_MS = 5000;

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
        v-for="t in toasts"
        :key="t.id"
        :model-value="TOAST_DURATION_MS"
        :variant="t.type === 'error' ? 'danger' : 'success'"
        :progress-props="{
          variant: t.type === 'error' ? 'danger' : 'success',
        }"
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
</style>
