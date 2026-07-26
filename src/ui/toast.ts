/**
 * Toast notification UI component.
 * Shows brief Bootstrap toast messages for success or error feedback.
 */

/**
 * Show a Bootstrap toast message.
 * @param type - 'error' or 'success' - determines which toast element to use.
 * @param message - The message to display.
 */
export function showToast(type: "error" | "success", message: string): void {
  const container = document.getElementById("toast-container");
  const toastEl = document.getElementById(`${type}-toast`);
  const bodyEl = document.getElementById(`${type}-toast-body`);
  if (!container || !toastEl || !bodyEl) return;
  bodyEl.textContent = message;
  const toast = window.bootstrap.Toast.getOrCreateInstance(toastEl);
  toast.show();
}
