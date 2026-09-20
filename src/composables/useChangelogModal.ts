/**
 * useChangelogModal — opener for the site changelog modal.
 *
 * Pushes `ChangelogModal` (stack id `changelog`) onto the shared modal
 * stack.  The modal owns its lazy commits fetch — the opener only opens.
 *
 * @example
 * const { openChangelogModal } = useChangelogModal();
 * openChangelogModal();
 */

import { useModalStack } from "./useModalStack";

/**
 * Changelog-modal opener.
 *
 * @returns `openChangelogModal()` — pushes the site changelog modal.
 */
export function useChangelogModal(): {
  /** Push the site changelog modal. */
  openChangelogModal: () => void;
} {
  const { push } = useModalStack();

  function openChangelogModal(): void {
    push({ id: "changelog", props: null });
  }

  return { openChangelogModal };
}
