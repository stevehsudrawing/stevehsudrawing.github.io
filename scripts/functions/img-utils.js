/**
 * Image utilities module.
 * Provides initialization for data-img-feature based image behaviors.
 */

/**
 * Initialize images with data-img-feature~="colored".
 * Reads data-mask-src and data-color-var attributes and applies them
 * via CSS custom properties (--img-mask-url and --img-color).
 */
function initColoredImages() {
    document.querySelectorAll('img[data-img-feature~="colored"]').forEach(img => {
        const maskSrc = img.getAttribute('data-mask-src');
        if (maskSrc) {
            img.style.setProperty('--img-mask-url', `url(${maskSrc})`);
        }

        const colorVar = img.getAttribute('data-color-var');
        if (colorVar) {
            img.style.setProperty('--img-color', `var(--${colorVar})`);
        }
    });
}
