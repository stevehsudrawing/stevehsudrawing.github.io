/**
 * QR code modal helper.
 * Generates a QR code for a given URL using the qrcode library
 * and displays it inside a Bootstrap modal, with colors matching
 * the current theme. An optional image can be overlaid at the
 * center of the QR code. The share card can be downloaded as a
 * PNG image via html-to-image, with html2canvas fallback.
 */

import QRCode from 'qrcode';
import { showExternalLinkConfirmation } from './external-link-confirmation.js';
import { translate } from '../core/i18n.js';
import { initImageLoadingOpacity, applyColoredImage } from '../core/img-utils.js';
import { initSvgInjection } from '../core/svg-utils.js';
import { errMsg, isInternalPage, setElementAttributes, showToast } from '../core/utils.js';
import { HastProperties } from '../types/hast.js';

/** Cached share-API availability; undefined = not yet checked. */
export let shareApiSupported: boolean | undefined;

/**
 * Trigger a file download from a Blob via a temporary anchor element.
 * @param blob - The blob to download.
 */
export function downloadBlob(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate a QR code for the specified URL and show it in a modal.
 * @param linkUrl - The URL to encode in the QR code.
 * @param imgProperties - Key/value pairs to set as attributes on
 *   the center overlay <img> element. The 'className' key accepts a string or
 *   array of CSS class names. `width` and `height` are always forced to 32.
 */
export async function showQRCodeModal(
    linkUrl: string,
    imgProperties?: Record<string, unknown> | null,
    hideOpenLink?: boolean
): Promise<void> {
    const htmlElement = document.documentElement;

    const modalLink = document.getElementById('qr-code-modal-link');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const modalElement = document.getElementById('qr-code-modal');
    const shareCard = document.getElementById('qr-share-card');
    const shareBtn = document.getElementById('qr-share-btn') as HTMLButtonElement | null;
    const downloadBtn = document.getElementById('qr-download-btn') as HTMLButtonElement | null;
    const openLinkBtn = document.getElementById('qr-open-link-btn') as HTMLElement | null;

    if (!modalLink || !qrCodeContainer || !modalElement || !shareCard || !shareBtn || !downloadBtn) {
        console.warn('QR code modal elements not found.');
        return;
    }

    // Store the URL and icon properties on the modal element so the
    // "Open Link" button can pass them back to the confirmation modal.
    (modalElement as unknown as Record<string, unknown>)._qrUrl = linkUrl;
    (modalElement as unknown as Record<string, unknown>)._qrIconProps = imgProperties || null;

    // Ensure the share card logo SVG is injected if not already.
    initSvgInjection();

    modalLink.textContent = linkUrl;
    qrCodeContainer.innerHTML = '';

    const computedStyles = getComputedStyle(htmlElement);
    const colorDark = computedStyles.getPropertyValue('--bs-body-color').trim() || '#000000';
    const pageBg = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';

    const canvas = document.createElement('canvas');
    qrCodeContainer.appendChild(canvas);

    await QRCode.toCanvas(canvas, linkUrl, {
        width: 250,
        margin: 0,
        color: { dark: colorDark, light: pageBg },
        errorCorrectionLevel: 'Q'
    });

    // --- Center overlay image ---
    const defaultImgProperties: HastProperties = {
        id: 'qr-code-icon',
        alt: 'Link',
        src: '/images/webp/null.webp',
        dataImgFeature: 'colored',
        dataSrcMask: '/images/webp/icons/link.webp',
        dataColorVar: 'bs-body-color'
    };

    const mergedProperties: Record<string, unknown> = Object.assign({}, defaultImgProperties, imgProperties || {});
    mergedProperties.id = 'qr-code-icon';
    mergedProperties.width = 32;
    mergedProperties.height = 32;

    // When a custom icon is provided, drop the default mask and color attributes.
    if (mergedProperties.src !== '/images/webp/null.webp') {
        delete mergedProperties.dataImgFeature;
        delete mergedProperties.dataSrcMask;
        delete mergedProperties.dataColorVar;
    }

    // Rounded-square background wrapper behind the icon
    const iconBg = document.createElement('span');
    iconBg.id = 'qr-code-icon-bg';

    const centerImg = document.createElement('img');
    setElementAttributes(centerImg, mergedProperties);
    if (mergedProperties.dataImgFeature === 'colored') {
        applyColoredImage(centerImg);
    }
    iconBg.appendChild(centerImg);
    qrCodeContainer.appendChild(iconBg);

    qrCodeContainer.querySelectorAll('img').forEach(initImageLoadingOpacity);

    // --- Set share card title from icon properties ---
    const titleEl = document.getElementById('qr-share-card-title');
    if (titleEl) {
        const i18nAltKey = mergedProperties.dataI18nAlt as string | undefined;
        const altText = i18nAltKey ? translate(i18nAltKey) : mergedProperties.alt as string | undefined;
        titleEl.textContent = altText ? altText : translate('text-link', 'Link');
    }

    const scale = 3;

    /**
     * Render the share card to a PNG blob.
     * Prefers html-to-image for pixel-perfect output; falls back to
     * html2canvas on environments where SVG foreignObject is not
     * supported (e.g., mobile browsers).
     */
    function renderShareCardBlob(): Promise<Blob> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hti = window.htmlToImage as any;
        return hti.toPng(shareCard!, {
            backgroundColor: pageBg,
            pixelRatio: scale
        }).then(function (dataUrl: string) {
            return fetch(dataUrl).then(function (response) {
                return response.blob();
            });
        }).catch(function () {
            // html-to-image failed (likely mobile), fall back to html2canvas
            return window.html2canvas(shareCard!, {
                backgroundColor: pageBg,
                scale: scale
            }).then(function (canvas) {
                return new Promise<Blob>(function (resolve, reject) {
                    canvas.toBlob(function (blob) {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('canvas.toBlob returned null'));
                        }
                    }, 'image/png');
                });
            });
        });
    }

    /**
     * Run renderShareCardBlob, managing button disabled state during the
     * operation, then call onSuccess with the resulting blob.
     * @param onSuccess - Called with the blob on success.
     * @param errorLabel - Label shown in the error toast on failure.
     */
    function runWithSpinner(onSuccess: (blob: Blob) => void, errorLabel?: string): void {
        setButtonsDisabled(true);
        renderShareCardBlob().then(function (blob) {
            setButtonsDisabled(false);
            onSuccess(blob);
        }).catch(function (error) {
            setButtonsDisabled(false);
            const label = errorLabel || 'Failed to generate QR code image';
            showToast('error', label + ': ' + errMsg(error));
            console.error(label + ':', error);
        });
    }

    /**
     * Set both action buttons to a disabled/enabled state.
     * @param disabled - Whether to disable the buttons.
     */
    function setButtonsDisabled(disabled: boolean): void {
        shareBtn!.disabled = disabled;
        downloadBtn!.disabled = disabled;
    }

    // --- Detect share-API support (once) and hide button if unsupported ---
    if (typeof shareApiSupported === 'undefined') {
        const testFile = new File([new Blob([''], { type: 'image/png' })], 'test.png', { type: 'image/png' });
        shareApiSupported = !!(navigator.canShare?.({ files: [testFile] }));
    }
    if (!shareApiSupported) {
        shareBtn.style.display = 'none';
    }

    // --- "Open Link" button (bottom-left) ---
    // Hides the QR modal and opens the external link confirmation modal.
    // Hidden for internal links (no confirmation needed) or when explicitly suppressed.
    if (openLinkBtn) {
        const isInternal = typeof isInternalPage === 'function' && isInternalPage(linkUrl);
        if (isInternal || hideOpenLink) {
            openLinkBtn.style.display = 'none';
        } else {
            openLinkBtn.style.display = '';
            openLinkBtn.onclick = function () {
                // Hide the QR modal, then show the confirmation modal after
                // the hide transition completes.
                const qrInstance = window.bootstrap.Modal.getInstance(modalElement);
                if (qrInstance) {
                    modalElement.addEventListener('hidden.bs.modal', function handler() {
                        modalElement.removeEventListener('hidden.bs.modal', handler);
                        if (typeof showExternalLinkConfirmation === 'function') {
                            if (imgProperties) {
                                showExternalLinkConfirmation(linkUrl, imgProperties);
                            } else {
                                showExternalLinkConfirmation(linkUrl);
                            }
                        }
                    });
                    qrInstance.hide();
                }
            };
        }
    }

    // --- Share handler (native share API) ---
    shareBtn.onclick = function () {
        runWithSpinner(function (blob) {
            const file = new File([blob], 'qr-code.png', { type: 'image/png' });
            navigator.share({ files: [file] }).catch(function (error) {
                if ((error as DOMException).name !== 'AbortError') {
                    showToast('error', 'Sharing failed: ' + errMsg(error));
                }
            });
        }, 'Failed to generate QR code image for sharing');
    };

    // --- Download handler (direct blob download) ---
    downloadBtn.onclick = function () {
        runWithSpinner(function (blob) {
            downloadBlob(blob);
        }, 'Failed to download QR code image');
    };

    const bootstrapModal = new window.bootstrap.Modal(modalElement);
    bootstrapModal.show();
}

/**
 * Set up delegated click listener for QR-code trigger elements.
 * Elements with `data-qr-url` will open the QR code modal on click.
 * The optional `data-qr-icon` attribute contains a JSON object with
 * hast-format icon properties for the centre overlay.
 *
 * Call once during page initialization. Uses event delegation on
 * `document`, so it survives SPA page transitions automatically.
 */
export function initQRCodeDelegation(): void {
    document.addEventListener('click', function (e: MouseEvent) {
        const trigger = (e.target as HTMLElement).closest('[data-qr-url]');
        if (!trigger) return;

        e.preventDefault();

        const url = trigger.getAttribute('data-qr-url');
        if (!url) return;

        const hideOpenLink = trigger.hasAttribute('data-no-open-link');

        let iconProps: Record<string, unknown> | null = null;
        const iconAttr = trigger.getAttribute('data-qr-icon');
        if (iconAttr) {
            try {
                iconProps = JSON.parse(iconAttr);
            } catch {
                console.warn('Invalid JSON in data-qr-icon:', iconAttr);
            }
        }

        showQRCodeModal(url, iconProps, hideOpenLink);
    });
}
