/**
 * Image utilities module.
 * Provides initialization for data-img-feature based image behaviors.
 */

/**
 * Apply colored (mask-based) styling to a single <img> element.
 * Reads data-mask-src and data-color-var attributes and sets the
 * --img-mask-url and --img-color CSS custom properties on the element.
 * @param {HTMLImageElement} img - The image element to style.
 */
function applyColoredImage(img) {
    const maskSrc = img.getAttribute('data-mask-src');
    if (maskSrc) {
        img.style.setProperty('--img-mask-url', `url(${maskSrc})`);
    }

    const colorVar = img.getAttribute('data-color-var');
    if (colorVar) {
        img.style.setProperty('--img-color', `var(--${colorVar})`);
    }
}

/**
 * Initialize all images with data-img-feature~="colored".
 * Delegates to applyColoredImage() for each matching element.
 */
function initColoredImages() {
    document.querySelectorAll('img[data-img-feature~="colored"]').forEach(applyColoredImage);
}
