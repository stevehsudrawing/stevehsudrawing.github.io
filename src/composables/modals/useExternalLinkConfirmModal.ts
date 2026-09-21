/**
 * useExternalLinkConfirmModal — opener for the external-link confirmation.
 *
 * Pushes `ExternalLinkConfirmModal` (stack id `external-link`) onto the
 * shared modal stack.  TypeAwareLink opens it for every external link;
 * the QR modal's "Open Link" forwards to it as well.
 *
 * @example
 * const { openExternalLinkConfirmModal } = useExternalLinkConfirmModal();
 * openExternalLinkConfirmModal({ url, icon, hideQR });
 */

import type { ExternalLinkConfirmModalProps } from "../../types/app";
import { useModalStack } from "./useModalStack";

/**
 * External-link-confirmation opener.
 *
 * @returns `openExternalLinkConfirmModal(props)` — pushes the modal.
 */
export function useExternalLinkConfirmModal(): {
  /** Push the external-link confirmation with the resolved props. */
  openExternalLinkConfirmModal: (props: ExternalLinkConfirmModalProps) => void;
} {
  const { push } = useModalStack();

  function openExternalLinkConfirmModal(
    props: ExternalLinkConfirmModalProps,
  ): void {
    push({ id: "external-link", props });
  }

  return { openExternalLinkConfirmModal };
}
