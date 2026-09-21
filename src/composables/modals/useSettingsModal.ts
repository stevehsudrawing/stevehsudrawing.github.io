/**
 * useSettingsModal — opener for the settings modal.
 *
 * Pushes `SettingsModal` (stack id `settings`) onto the shared modal
 * stack — the AppNavbar gear button's entry point.
 *
 * @example
 * const { openSettingsModal } = useSettingsModal();
 * openSettingsModal();
 */

import { useModalStack } from "./useModalStack";

/**
 * Settings-modal opener.
 *
 * @returns `openSettingsModal()` — pushes the settings modal.
 */
export function useSettingsModal(): {
  /** Push the settings modal. */
  openSettingsModal: () => void;
} {
  const { push } = useModalStack();

  function openSettingsModal(): void {
    push({ id: "settings", props: null });
  }

  return { openSettingsModal };
}
