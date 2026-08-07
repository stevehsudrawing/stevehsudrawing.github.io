/**
 * useCrossModalNavigation — shared state for modal-to-modal handoffs.
 *
 * Manages the reactive props (URLs, image properties, flags) that
 * flow between ExternalLinkConfirmModal and QRCodeModal, plus the
 * navigation helpers that switch from one modal to the other.
 */

import { ref, nextTick, type Ref } from "vue";

/** Shape of a modal component's public API (defineExpose). */
interface ModalHandle {
  show: () => void;
}

/**
 * Create shared state and helpers for cross-modal navigation.
 *
 * @param qrCodeModalRef - Template ref for the QRCodeModal.
 * @param extLinkModalRef - Template ref for the ExternalLinkConfirmModal.
 */
export function useCrossModalNavigation(
  qrCodeModalRef: Ref<ModalHandle | undefined>,
  extLinkModalRef: Ref<ModalHandle | undefined>,
): {
  /** External link URL (bound to ExternalLinkConfirmModal). */
  extLinkUrl: Ref<string>;
  /** HAST image properties for the external link icon. */
  extLinkImgProps: Ref<Record<string, unknown> | null>;
  /** Whether to hide the "Show QR Code" button. */
  extLinkHideQR: Ref<boolean>;
  /** QR code URL (bound to QRCodeModal). */
  qrUrl: Ref<string>;
  /** HAST image properties for the QR overlay icon. */
  qrImgProps: Ref<Record<string, unknown> | null>;
  /** Whether to hide the "Open Link" button in QRCodeModal. */
  qrHideOpenLink: Ref<boolean>;
  /** Navigate to the external URL (called from ExternalLinkConfirmModal). */
  onExtLinkNavigate: (url: string, openInNewTab: boolean) => void;
  /** Switch from ExternalLinkConfirmModal to QRCodeModal. */
  onExtLinkShowQR: (
    url: string,
    imgProperties: Record<string, unknown> | null,
  ) => void;
  /** Switch from QRCodeModal back to ExternalLinkConfirmModal. */
  onQROpenLink: (
    url: string,
    imgProperties: Record<string, unknown> | null,
  ) => void;
} {
  // ---- State ----

  const extLinkUrl = ref("");
  const extLinkImgProps = ref<Record<string, unknown> | null>(null);
  const extLinkHideQR = ref(false);
  const qrUrl = ref("");
  const qrImgProps = ref<Record<string, unknown> | null>(null);
  const qrHideOpenLink = ref(false);

  // ---- Actions ----

  function onExtLinkNavigate(url: string, openInNewTab: boolean): void {
    if (openInNewTab) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = url;
    }
  }

  function onExtLinkShowQR(
    url: string,
    imgProperties: Record<string, unknown> | null,
  ): void {
    qrUrl.value = url;
    qrImgProps.value = imgProperties;
    qrHideOpenLink.value = false;
    nextTick(() => qrCodeModalRef.value?.show());
  }

  function onQROpenLink(
    url: string,
    imgProperties: Record<string, unknown> | null,
  ): void {
    extLinkUrl.value = url;
    extLinkImgProps.value = imgProperties;
    extLinkHideQR.value = false;
    nextTick(() => extLinkModalRef.value?.show());
  }

  return {
    extLinkUrl,
    extLinkImgProps,
    extLinkHideQR,
    qrUrl,
    qrImgProps,
    qrHideOpenLink,
    onExtLinkNavigate,
    onExtLinkShowQR,
    onQROpenLink,
  };
}
