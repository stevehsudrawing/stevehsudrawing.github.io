/**
 * Centralized modal focus management.
 * Handles focus restoration (returning focus to the trigger element
 * when a modal closes) and default-focus assignment (auto-focusing
 * elements marked with the .default-keyboard-focus class when a
 * modal opens).
 */

/** The element that was focused before the current modal was shown. */
let triggerElement: HTMLElement | null = null;

/**
 * Initialize modal focus management.
 * Sets up delegated listeners on document for Bootstrap modal events
 * so that focus is automatically restored when a modal closes and
 * the .default-keyboard-focus element (if any) receives focus when
 * a modal opens.
 *
 * Call once during application initialization.
 */
export function initModalFocusManagement(): void {
  // Capture the currently focused element before a modal opens.
  document.addEventListener("show.bs.modal", function () {
    triggerElement = document.activeElement as HTMLElement | null;
  });

  // Restore focus to the captured element when a modal closes.
  document.addEventListener("hidden.bs.modal", function () {
    if (triggerElement && triggerElement.isConnected) {
      triggerElement.focus();
    }
    triggerElement = null;
  });

  // Auto-focus the element marked with .default-keyboard-focus
  // inside the newly shown modal.
  document.addEventListener("shown.bs.modal", function (e: Event) {
    const modal = e.target as HTMLElement;
    if (!modal) return;
    const defaultFocus = modal.querySelector(
      ".default-keyboard-focus",
    ) as HTMLElement | null;
    if (defaultFocus) {
      defaultFocus.focus();
    }
  });
}
