/**
 * useStickerModal — opener for the sticker modal.
 *
 * Pushes `StickerModal` (stack id `sticker`) onto the shared modal
 * stack.  Called by AboutPage's major-color sequence and by App.vue's
 * secret-hash trigger; omitting `props` lets the modal pick a random
 * pool member.
 *
 * @example
 * const { openStickerModal } = useStickerModal();
 * openStickerModal();
 */

import type { StickerModalProps } from "../types/app";
import { useModalStack } from "./useModalStack";

/**
 * Sticker-modal opener.
 *
 * @returns `openStickerModal(props?)` — pushes the sticker modal.
 */
export function useStickerModal(): {
  /** Push the sticker modal; omit `props` for a random pool pick. */
  openStickerModal: (props?: StickerModalProps) => void;
} {
  const { push } = useModalStack();

  function openStickerModal(props?: StickerModalProps): void {
    push({ id: "sticker", props: props ?? null });
  }

  return { openStickerModal };
}
