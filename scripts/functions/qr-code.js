/**
 * QR code modal helper.
 * Generates a QR code for a given URL using the qrcodejs library
 * and displays it inside a Bootstrap modal, with colors matching
 * the current theme. An optional image can be overlaid at the
 * center of the QR code.
 */

/**
 * Generate a QR code for the specified URL and show it in a modal.
 * @param {string} linkUrl - The URL to encode in the QR code.
 * @param {Object} [imgProperties] - Key/value pairs to set as attributes on
 *   the center overlay <img> element. The 'classes' key accepts a string or
 *   array of CSS class names. `width` and `height` are always forced to 32.
 */
function showQRCodeModal(linkUrl, imgProperties) {
    const htmlElement = document.documentElement;

    const modalTitle = document.getElementById('qr-code-modal-title');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const modalElement = document.getElementById('qr-code-modal');

    if (!modalTitle || !qrCodeContainer || !modalElement) {
        console.warn('QR code modal elements not found.');
        return;
    }

    modalTitle.textContent = linkUrl;
    qrCodeContainer.innerHTML = '';

    const computedStyles = getComputedStyle(htmlElement);
    const colorDark = computedStyles.getPropertyValue('--bs-body-color').trim() || '#000000';
    const colorLight = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';

    new QRCode(qrCodeContainer, {
        text: linkUrl,
        width: 232,
        height: 232,
        colorDark,
        colorLight,
        correctLevel: QRCode.CorrectLevel.Q
    });

    // --- Center overlay image ---
    const defaultImgProperties = {
        id: 'qr-code-icon',
        alt: 'Link',
        src: '/images/null.png',
        classes: [
            'img-mono-fill-body-color',
            'img-mono-link'
        ]
    };

    const mergedProperties = Object.assign({}, defaultImgProperties, imgProperties);
    mergedProperties.id = 'qr-code-icon';
    mergedProperties.width = 32;
    mergedProperties.height = 32;

    // When a custom icon is provided (src is not the default null.png),
    // drop the default mask classes — the caller provides its own.
    if (mergedProperties.src !== '/images/null.png' && mergedProperties.classes) {
        const classes = Array.isArray(mergedProperties.classes)
            ? mergedProperties.classes
            : mergedProperties.classes.split(' ').filter(Boolean);
        mergedProperties.classes = classes.filter(
            cls => cls !== 'img-mono-fill-body-color' && cls !== 'img-mono-link'
        );
    }

    // Rounded-square background wrapper behind the icon
    const iconBg = document.createElement('span');
    iconBg.id = 'qr-code-icon-bg';

    const centerImg = document.createElement('img');
    setElementAttributes(centerImg, mergedProperties);
    iconBg.appendChild(centerImg);
    qrCodeContainer.appendChild(iconBg);

    const bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}
