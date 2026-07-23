/**
 * Image utilities module.
 * Provides initialization for data-img-feature based image behaviors.
 */

/**
 * Apply colored (mask-based) styling to a single <img> element.
 * Reads data-src-mask and data-color-var attributes and sets the
 * --img-mask-url and --img-color CSS custom properties on the element.
 * @param img - The image element to style.
 */
export function applyColoredImage(img: HTMLImageElement): void {
    const maskSrc = img.getAttribute('data-src-mask');
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
export function initAllColoredImages(): void {
    document.querySelectorAll<HTMLImageElement>('img[data-img-feature~="colored"]').forEach(applyColoredImage);
}

/**
 * Mark an image as loaded by adding the data-img-loaded attribute.
 * @param img - The image element to mark as loaded.
 */
export function markImageLoaded(img: HTMLImageElement): void {
    img.setAttribute('data-img-loaded', '');
}

/**
 * Mark an image as unloaded (loading) by removing the data-img-loaded attribute.
 * The image will revert to its default semi-transparent state via CSS.
 * @param img - The image element to mark as unloaded.
 */
export function markImageUnloaded(img: HTMLImageElement): void {
    img.removeAttribute('data-img-loaded');
}

/**
 * Initialize image loading opacity on a single <img> element.
 * Skips colored images (they use CSS mask rendering).
 * For already-loaded (cached) images, marks them immediately.
 * For loading images, sets up load and error listeners to mark when ready.
 * @param img - The image element to initialize.
 */
export function initImageLoadingOpacity(img: HTMLImageElement): void {
    // Colored images use CSS mask rendering, not the image src
    if (img.matches('[data-img-feature~="colored"]')) {
        return;
    }

    if (img.complete && img.naturalWidth > 0) {
        // Already loaded (e.g. from browser cache)
        markImageLoaded(img);
    } else {
        img.addEventListener('load', function () {
            markImageLoaded(img);
        }, { once: true });
        img.addEventListener('error', function () {
            markImageLoaded(img);
        }, { once: true });
    }
}

/**
 * Initialize image loading opacity for all <img> elements on the page.
 * Delegates to initImageLoadingOpacity() for each matching element.
 */
export function initAllImageLoadingOpacity(): void {
    document.querySelectorAll<HTMLImageElement>('img').forEach(initImageLoadingOpacity);
}
