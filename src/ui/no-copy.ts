/**
 * No-copy protection bridge -- delegates to the Vue CopyProtectedImg component.
 *
 * When Vue is active (window.__noCopy exists), delegates to the
 * CopyProtectedImg component.  Otherwise, sets up event listeners directly
 * as a fallback (for environments without Vue).
 */

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

/**
 * Initialize contextmenu and dragstart prevention on .no-copy elements.
 * On Vue pages: delegates to the CopyProtectedImg component.
 */
export function initNoCopyProtection(): void {
  try {
    if (window.__noCopy) {
      // Vue path -- delegate to the component
      window.__noCopy.init();
    } else {
      // Fallback -- set up listeners directly
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
      document.addEventListener("contextmenu", onContextMenu);
      document.addEventListener("dragstart", onDragStart);
    }
  } catch (error) {
    console.error("Failed to initialize no-copy protection:", error);
  }
}
