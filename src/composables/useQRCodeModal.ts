/**
 * useQRCodeModal — opener for the QR-code modal.
 *
 * Pushes `QRCodeModal` (stack id `qr-code`) onto the shared modal stack.
 * Three callers share it: the QRCodeButton trigger, the external-link
 * confirmation's "Show QR" and the group viewer's share button.
 *
 * @example
 * const { openQRCodeModal } = useQRCodeModal();
 * openQRCodeModal({ url, icon, hideOpenLink: false });
 */

import type { QRCodeModalProps } from "../types/app";
import { useModalStack } from "./useModalStack";

/**
 * Options for `openQRCodeModal()` — the modal props with `hideOpenLink`
 * optional (default: false).
 */
export type OpenQRCodeModalOptions = Omit<QRCodeModalProps, "hideOpenLink"> & {
  /** Hide the "Open Link" button (default: false). */
  hideOpenLink?: boolean;
};

/**
 * QR-code-modal opener.
 *
 * @returns `openQRCodeModal(options)` — pushes the QR-code modal.
 */
export function useQRCodeModal(): {
  /** Push the QR-code modal; `hideOpenLink` defaults to false. */
  openQRCodeModal: (options: OpenQRCodeModalOptions) => void;
} {
  const { push } = useModalStack();

  function openQRCodeModal(options: OpenQRCodeModalOptions): void {
    push({
      id: "qr-code",
      props: {
        url: options.url,
        icon: options.icon,
        hideOpenLink: options.hideOpenLink ?? false,
      },
    });
  }

  return { openQRCodeModal };
}
