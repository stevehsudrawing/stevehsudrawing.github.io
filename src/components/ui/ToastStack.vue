<!--
  ToastStack.vue — Reactive toast notification stack.
  Replaces ui/toast.ts imperative DOM manipulation.
  Exposes showToast() via provide/inject so any descendant component
  can trigger a toast without importing legacy modules.
-->
<script setup lang="ts">
import { ref, provide } from "vue";
import { SHOW_TOAST_KEY } from "../../composables/useToast.js";

// =========================================================================
// Types
// =========================================================================

/** A single toast notification in the stack. */
interface ToastEntry {
  id: number;
  type: "success" | "error";
  message: string;
  visible: boolean;
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
 * Show a toast notification.  The toast auto-dismisses after a few seconds.
 * @param type - 'success' (green) or 'error' (red).
 * @param message - Text to display in the toast body.
 */
function showToast(type: "success" | "error", message: string): void {
  const id = nextId++;
  toasts.value = [...toasts.value, { id, type, message, visible: true }];
}

/**
 * Remove a toast from the stack by id.
 * @param id - The unique id assigned when the toast was created.
 */
function removeToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

/** Make showToast available to all descendant components. */
provide(SHOW_TOAST_KEY, showToast);

// Expose for global / legacy consumers
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
        v-model="t.visible"
        :variant="t.type === 'error' ? 'danger' : 'success'"
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
