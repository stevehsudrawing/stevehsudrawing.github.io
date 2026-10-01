/**
 * useSkinViewerModal — opener for the skin viewer modal.
 *
 * Pushes `SkinViewerModal` (stack id `skin-viewer`) onto the shared
 * modal stack; the modal is parameterless.
 *
 * @example
 * const { openSkinViewerModal } = useSkinViewerModal();
 * openSkinViewerModal();
 */

import { useModalStack } from "./useModalStack";

/**
 * Skin-viewer-modal opener.
 *
 * @returns `openSkinViewerModal()` — pushes the skin viewer modal.
 */
export function useSkinViewerModal(): {
  /** Push the skin viewer modal. */
  openSkinViewerModal: () => void;
} {
  const { push } = useModalStack();

  function openSkinViewerModal(): void {
    push({ id: "skin-viewer", props: null });
  }

  return { openSkinViewerModal };
}
