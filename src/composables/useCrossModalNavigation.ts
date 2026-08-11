/**
 * useCrossModalNavigation — shared state for modal-to-modal handoffs.
 *
 * Manages the reactive props (URLs, image properties, flags) that
 * flow between ExternalLinkConfirmModal and QRCodeModal, plus the
 * navigation helpers that switch from one modal to the other.
 */

import { ref, nextTick, type Ref } from "vue";
import type { FeatureAwarePictureProps, ColoredImgProps } from "../types/app";

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
  /** FeatureAwarePicture props for the external link icon. */
  extLinkPictureProps: Ref<FeatureAwarePictureProps | null>;
  /** ColoredImg props for the external link icon. */
  extLinkColoredProps: Ref<ColoredImgProps | null>;
  /** Whether to hide the "Show QR Code" button. */
  extLinkHideQR: Ref<boolean>;
  /** QR code URL (bound to QRCodeModal). */
  qrUrl: Ref<string>;
  /** FeatureAwarePicture props for the QR overlay icon. */
  qrPictureProps: Ref<FeatureAwarePictureProps | null>;
  /** ColoredImg props for the QR overlay icon. */
  qrColoredProps: Ref<ColoredImgProps | null>;
  /** Whether to hide the "Open Link" button in QRCodeModal. */
  qrHideOpenLink: Ref<boolean>;
  /** Navigate to the external URL (called from ExternalLinkConfirmModal). */
  onExtLinkNavigate: (url: string, openInNewTab: boolean) => void;
  /** Switch from ExternalLinkConfirmModal to QRCodeModal. */
  onExtLinkShowQR: (
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
  ) => void;
  /** Switch from QRCodeModal back to ExternalLinkConfirmModal. */
  onQROpenLink: (
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
  ) => void;
} {
  // ---- State ----

  const extLinkUrl = ref("");
  const extLinkPictureProps = ref<FeatureAwarePictureProps | null>(null);
  const extLinkColoredProps = ref<ColoredImgProps | null>(null);
  const extLinkHideQR = ref(false);
  const qrUrl = ref("");
  const qrPictureProps = ref<FeatureAwarePictureProps | null>(null);
  const qrColoredProps = ref<ColoredImgProps | null>(null);
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
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
  ): void {
    qrUrl.value = url;
    qrPictureProps.value = pictureProps;
    qrColoredProps.value = coloredProps;
    qrHideOpenLink.value = false;
    nextTick(() => qrCodeModalRef.value?.show());
  }

  function onQROpenLink(
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
  ): void {
    extLinkUrl.value = url;
    extLinkPictureProps.value = pictureProps;
    extLinkColoredProps.value = coloredProps;
    extLinkHideQR.value = false;
    nextTick(() => extLinkModalRef.value?.show());
  }

  return {
    extLinkUrl,
    extLinkPictureProps,
    extLinkColoredProps,
    extLinkHideQR,
    qrUrl,
    qrPictureProps,
    qrColoredProps,
    qrHideOpenLink,
    onExtLinkNavigate,
    onExtLinkShowQR,
    onQROpenLink,
  };
}
