/**
 * QR code modal helper.
 * Generates a QR code for a given URL using the qrcodejs library
 * and displays it inside a Bootstrap modal, with colors matching
 * the current theme. An optional image can be overlaid at the
 * center of the QR code. The share card can be downloaded as a
 * PNG image via html-to-image, with html2canvas fallback.
 */

/** @type {boolean|undefined} Cached share-API availability; undefined = not yet checked. */
var shareApiSupported;

/**
 * Trigger a file download from a Blob via a temporary anchor element.
 * @param {Blob} blob - The blob to download.
 */
function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate a QR code for the specified URL and show it in a modal.
 * @param {string} linkUrl - The URL to encode in the QR code.
 * @param {Object} [imgProperties] - Key/value pairs to set as attributes on
 *   the center overlay <img> element. The 'classes' key accepts a string or
 *   array of CSS class names. `width` and `height` are always forced to 32.
 */
function showQRCodeModal(linkUrl, imgProperties) {
    var htmlElement = document.documentElement;

    var modalLink = document.getElementById('qr-code-modal-link');
    var qrCodeContainer = document.getElementById('qr-code-container');
    var modalElement = document.getElementById('qr-code-modal');
    var shareCard = document.getElementById('qr-share-card');
    var shareBtn = document.getElementById('qr-share-btn');
    var downloadBtn = document.getElementById('qr-download-btn');

    if (!modalLink || !qrCodeContainer || !modalElement || !shareCard || !shareBtn || !downloadBtn) {
        console.warn('QR code modal elements not found.');
        return;
    }

    // Ensure the share card logo SVG is injected if not already.
    initSvgInjection();

    modalLink.textContent = linkUrl;
    qrCodeContainer.innerHTML = '';

    var computedStyles = getComputedStyle(htmlElement);
    var colorDark = computedStyles.getPropertyValue('--bs-body-color').trim() || '#000000';
    var pageBg = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';

    new QRCode(qrCodeContainer, {
        text: linkUrl,
        width: 250,
        height: 250,
        colorDark: colorDark,
        colorLight: pageBg,
        correctLevel: QRCode.CorrectLevel.Q
    });

    // --- Center overlay image ---
    var defaultImgProperties = {
        id: 'qr-code-icon',
        alt: 'Link',
        src: '/images/null.png',
        'data-img-feature': 'colored',
        'data-src-mask': '/images/icons/link.webp',
        'data-color-var': 'bs-body-color'
    };

    var mergedProperties = Object.assign({}, defaultImgProperties, imgProperties);
    mergedProperties.id = 'qr-code-icon';
    mergedProperties.width = 32;
    mergedProperties.height = 32;

    // When a custom icon is provided, drop the default mask and color attributes.
    if (mergedProperties.src !== '/images/null.png') {
        delete mergedProperties['data-img-feature'];
        delete mergedProperties['data-src-mask'];
        delete mergedProperties['data-color-var'];
    }

    // Rounded-square background wrapper behind the icon
    var iconBg = document.createElement('span');
    iconBg.id = 'qr-code-icon-bg';

    var centerImg = document.createElement('img');
    setElementAttributes(centerImg, mergedProperties);
    if (mergedProperties['data-img-feature'] === 'colored') {
        applyColoredImage(centerImg);
    }
    iconBg.appendChild(centerImg);
    qrCodeContainer.appendChild(iconBg);

    // --- Set share card title from icon properties ---
    var titleEl = document.getElementById('qr-share-card-title');
    if (titleEl) {
        var i18nAltKey = mergedProperties['data-i18n-alt'];
        var altText = i18nAltKey ? translate(i18nAltKey) : mergedProperties.alt;
        titleEl.textContent = altText ? altText : translate('text-link', 'Link');
    }

    var scale = 3;
    /**
     * Render the share card to a PNG blob.
     * Prefers html-to-image for pixel-perfect output; falls back to
     * html2canvas on environments where SVG foreignObject is not
     * supported (e.g., mobile browsers).
     * @returns {Promise<Blob>}
     */
    function renderShareCardBlob() {
        return htmlToImage.toPng(shareCard, {
            backgroundColor: pageBg,
            pixelRatio: scale
        }).then(function (dataUrl) {
            return fetch(dataUrl).then(function (response) {
                return response.blob();
            });
        }).catch(function () {
            // html-to-image failed (likely mobile), fall back to html2canvas
            return html2canvas(shareCard, {
                backgroundColor: pageBg,
                scale: scale
            }).then(function (canvas) {
                return new Promise(function (resolve, reject) {
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
     * @param {Function} onSuccess - Called with the blob on success.
     * @param {string} [errorLabel] - Label shown in the error toast on failure.
     */
    function runWithSpinner(onSuccess, errorLabel) {
        setButtonsDisabled(true);
        renderShareCardBlob().then(function (blob) {
            setButtonsDisabled(false);
            onSuccess(blob);
        }).catch(function (error) {
            setButtonsDisabled(false);
            var label = errorLabel || 'Failed to generate QR code image';
            showErrorToast(label + ': ' + errMsg(error));
            console.error(label + ':', error);
        });
    }

    /**
     * Set both action buttons to a disabled/enabled state.
     * @param {boolean} disabled - Whether to disable the buttons.
     */
    function setButtonsDisabled(disabled) {
        shareBtn.disabled = disabled;
        downloadBtn.disabled = disabled;
    }

    // --- Detect share-API support (once) and hide button if unsupported ---
    if (typeof shareApiSupported === 'undefined') {
        var testFile = new File([new Blob([''], { type: 'image/png' })], 'test.png', { type: 'image/png' });
        shareApiSupported = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [testFile] }));
    }
    if (!shareApiSupported) {
        shareBtn.style.display = 'none';
    }

    // --- Share handler (native share API) ---
    shareBtn.onclick = function () {
        runWithSpinner(function (blob) {
            var file = new File([blob], 'qr-code.png', { type: 'image/png' });
            navigator.share({ files: [file] }).catch(function (error) {
                if (error.name !== 'AbortError') {
                    showErrorToast('Sharing failed: ' + errMsg(error));
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

    var bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}
