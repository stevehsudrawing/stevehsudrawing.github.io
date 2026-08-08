/**
 * Copy protection — prevents copying .no-copy elements via contextmenu
 * and dragstart event delegation.
 */

/**
 * Set up document-level event delegation to block copy actions on
 * .no-copy elements.  Idempotent — safe to call multiple times.
 */
export function initNoCopyProtection(): void {
  // Remove first to prevent duplicates
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("dragstart", onDragStart);
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("dragstart", onDragStart);
}

/**
 * Remove copy-protection event listeners.
 */
export function disposeNoCopyProtection(): void {
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("dragstart", onDragStart);
}

// =========================================================================
// Helpers
// =========================================================================

function onContextMenu(e: MouseEvent): void {
  if ((e.target as HTMLElement).closest(".no-copy")) {
    e.preventDefault();
  }
}

function onDragStart(e: DragEvent): void {
  if ((e.target as HTMLElement).closest(".no-copy")) {
    e.preventDefault();
  }
}
