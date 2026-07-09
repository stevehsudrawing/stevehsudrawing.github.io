/**
 * QR code modal helper.
 * Generates a QR code for a given URL using the qrcodejs library
 * and displays it inside a Bootstrap modal, with colors matching
 * the current theme. An optional image can be overlaid at the
 * center of the QR code. The share card can be downloaded as a
 * PNG image via html-to-image.
 */

/**
 * Clone the navbar brand SVG logo into the share card header
 * if it has not been inserted yet.
 */
function ensureShareCardLogo() {
    var logoContainer = document.getElementById('qr-share-card-logo-container');
    if (!logoContainer || logoContainer.firstChild) {
        return;
    }
    var navbarLogoSvg = document.querySelector('.navbar-brand svg');
    if (!navbarLogoSvg) {
        return;
    }
    var logoClone = navbarLogoSvg.cloneNode(true);
    logoClone.id = 'qr-share-card-logo';
    logoClone.removeAttribute('width');
    logoClone.removeAttribute('height');
    logoClone.setAttribute('width', '25');
    logoClone.setAttribute('height', '21');
    var path = logoClone.querySelector('path');
    if (path) {
        path.setAttribute('fill', 'currentColor');
    }
    logoContainer.appendChild(logoClone);
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

    var modalTitle = document.getElementById('qr-code-modal-title');
    var qrCodeContainer = document.getElementById('qr-code-container');
    var modalElement = document.getElementById('qr-code-modal');
    var shareCard = document.getElementById('qr-share-card');
    var downloadBtn = document.getElementById('qr-download-btn');

    if (!modalTitle || !qrCodeContainer || !modalElement || !shareCard || !downloadBtn) {
        console.warn('QR code modal elements not found.');
        return;
    }

    // Ensure the navbar logo is cloned into the share card header.
    ensureShareCardLogo();

    modalTitle.textContent = linkUrl;
    qrCodeContainer.innerHTML = '';

    var computedStyles = getComputedStyle(htmlElement);
    var colorDark = computedStyles.getPropertyValue('--bs-body-color').trim() || '#000000';
    var colorLight = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';
    var modalBg = computedStyles.getPropertyValue('--bs-body-bg').trim() || '#ffffff';

    new QRCode(qrCodeContainer, {
        text: linkUrl,
        width: 232,
        height: 232,
        colorDark: colorDark,
        colorLight: colorLight,
        correctLevel: QRCode.CorrectLevel.Q
    });

    // --- Center overlay image ---
    var defaultImgProperties = {
        id: 'qr-code-icon',
        alt: 'Link',
        src: '/images/null.png',
        classes: [
            'img-mono-fill-body-color',
            'img-mono-link'
        ]
    };

    var mergedProperties = Object.assign({}, defaultImgProperties, imgProperties);
    mergedProperties.id = 'qr-code-icon';
    mergedProperties.width = 32;
    mergedProperties.height = 32;

    // When a custom icon is provided (src is not the default null.png),
    // drop the default mask classes — the caller provides its own.
    if (mergedProperties.src !== '/images/null.png' && mergedProperties.classes) {
        var classes = Array.isArray(mergedProperties.classes)
            ? mergedProperties.classes
            : mergedProperties.classes.split(' ').filter(Boolean);
        mergedProperties.classes = classes.filter(
            function (cls) { return cls !== 'img-mono-fill-body-color' && cls !== 'img-mono-link'; }
        );
    }

    // Rounded-square background wrapper behind the icon
    var iconBg = document.createElement('span');
    iconBg.id = 'qr-code-icon-bg';

    var centerImg = document.createElement('img');
    setElementAttributes(centerImg, mergedProperties);
    iconBg.appendChild(centerImg);
    qrCodeContainer.appendChild(iconBg);

    // --- Download handler ---
    downloadBtn.onclick = function () {
        htmlToImage.toPng(shareCard, {
            backgroundColor: modalBg,
            pixelRatio: 2
        }).then(function (dataUrl) {
            download(dataUrl, 'qr-code.png', 'image/png');
        }).catch(function (error) {
            console.error('Failed to download QR code image:', error);
        });
    };

    var bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}
