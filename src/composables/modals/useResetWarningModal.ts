/**
 * useResetWarningModal — opener for the reset-warning modal.
 *
 * Pushes `ResetWarningModal` (stack id `reset-warning`) onto the shared
 * modal stack — opened from the settings modal's Reset button; Cancel
 * pops back to settings, Continue clears the stack after a reset.
 *
 * @example
 * const { openResetWarningModal } = useResetWarningModal();
 * openResetWarningModal();
 */

import { useModalStack } from "./useModalStack";

/**
 * ResetWarning-modal opener.
 *
 * @returns `openResetWarningModal()` — pushes the reset-warning modal.
 */
export function useResetWarningModal(): {
  /** Push the reset-warning modal. */
  openResetWarningModal: () => void;
} {
  const { push } = useModalStack();

  function openResetWarningModal(): void {
    push({ id: "reset-warning", props: null });
  }

  return { openResetWarningModal };
}
