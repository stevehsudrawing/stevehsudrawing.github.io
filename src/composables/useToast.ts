/**
 * Toast composable — inject the global showToast function.
 *
 * Relies on ToastStack.vue having provided the SHOW_TOAST_KEY
 * via `provide`.  Must be called inside a component that is a
 * descendant of <ToastStack> (or App.vue where ToastStack is mounted).
 */
import { inject } from "vue";

/** Injection key shared between ToastStack.vue and useToast(). */
export const SHOW_TOAST_KEY = Symbol("showToast");

/**
 * @returns showToast(type, message) — call this to display a notification.
 */
export function useToast(): {
  showToast: (type: "success" | "error", message: string) => void;
} {
  const showToast =
    inject<(type: "success" | "error", message: string) => void>(
      SHOW_TOAST_KEY,
    );
  if (!showToast) {
    throw new Error(
      "useToast() must be used inside a component that is a descendant of <ToastStack>",
    );
  }
  return { showToast };
}
