/**
 * Image utilities module.
 * Provides initialization for data-img-feature based image behaviors.
 */

/**
 * Apply colored (mask-based) styling to a single <img> element.
 * Reads data-src-mask and data-color-var attributes and sets the
 * --img-mask-url and --img-color CSS custom properties on the element.
 * @param {HTMLImageElement} img - The image element to style.
 */
function applyColoredImage(img) {
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
function initAllColoredImages() {
    document.querySelectorAll('img[data-img-feature~="colored"]').forEach(applyColoredImage);
}

/**
 * Mark an image as loaded by setting the data-img-loaded attribute.
 * This transitions the image from semi-transparent (opacity 0.5) to fully opaque.
 * @param {HTMLImageElement} img - The image element to mark as loaded.
 */
function markImageLoaded(img) {
    img.setAttribute('data-img-loaded', '');
}

/**
 * Set up load and error listeners on a single image with
 * data-img-feature~="loading-opacity".
 * If the image is already complete (cached / loaded before this call),
 * marks it as loaded immediately. Otherwise listens for load/error events.
 * Idempotent: safe to call multiple times on the same element.
 * @param {HTMLImageElement} img - The image element to observe.
 */
function applyLoadingOpacity(img) {
    // Clean up any previously attached listeners to ensure idempotency.
    if (img._loadingOpacityLoad) {
        img.removeEventListener('load', img._loadingOpacityLoad);
        img.removeEventListener('error', img._loadingOpacityError);
        img._loadingOpacityLoad = null;
        img._loadingOpacityError = null;
    }

    // If the image has already finished loading (e.g. from cache),
    // mark it as loaded right away and skip listeners.
    if (img.complete && img.naturalWidth > 0) {
        markImageLoaded(img);
        return;
    }

    // Ensure the image starts in the loading (semi-transparent) state.
    img.removeAttribute('data-img-loaded');

    var onLoad = function () {
        markImageLoaded(img);
    };

    var onError = function () {
        // Mark as loaded even on error to prevent permanent semi-transparency.
        markImageLoaded(img);
    };

    // Store references on the element so they can be cleaned up later.
    img._loadingOpacityLoad = onLoad;
    img._loadingOpacityError = onError;

    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
}

/**
 * Reset a loading-opacity image back to the semi-transparent state and
 * re-attach load/error listeners for the new src.
 * Use after programmatically changing img.src (e.g. during theme switches)
 * so the new source is treated as "still loading".
 * @param {HTMLImageElement} img - The image element to reset.
 */
function resetImageLoadingState(img) {
    img.removeAttribute('data-img-loaded');
    applyLoadingOpacity(img);
}

/**
 * Initialize all images with data-img-feature~="loading-opacity".
 * Delegates to applyLoadingOpacity() for each matching element.
 */
function initAllLoadingOpacityImages() {
    document.querySelectorAll('img[data-img-feature~="loading-opacity"]').forEach(applyLoadingOpacity);
}
