function showQRCodeModal(linkUrl) {
    const modalTitle = document.getElementById('qrCodeModalTitle');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const modalElement = document.getElementById('qrCodeModal');

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
        correctLevel: QRCode.CorrectLevel.L
    });

    const bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}
