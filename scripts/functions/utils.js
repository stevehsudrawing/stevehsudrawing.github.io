/**
 * Utility functions.
 * Provides shared helpers for some logic used across multiple modules.
 */

/**
 * Normalize a URL pathname so that the root maps to /index.html.
 * @param {string} pathname - e.g. "/", "", "/about.html"
 * @returns {string} - e.g. "/index.html", "/about.html"
 */
function normalizeInternalPath(pathname) {
    if (pathname === '/' || pathname === '') return '/index.html';
    return pathname;
}

/**
 * Extract the page name (without .html extension) from a pathname.
 * The root path maps to "index".
 * @param {string} pathname - e.g. "/", "/about.html", "/artworks-and-videos.html"
 * @returns {string} - e.g. "index", "about", "artworks-and-videos"
 */
function extractPageName(pathname) {
    const normalized = normalizeInternalPath(pathname);
    // normalized is like "/index.html" or "/about.html"
    const filename = normalized.split('/').pop();
    return filename.replace(/\.html$/, '');
}

/**
 * Set multiple attributes and/or classes on a DOM element from a properties object.
 * Special handling: 'classes' can be a string or array and is added via classList.
 * Values of false, null, or undefined are skipped.
 * @param {HTMLElement} element - The target element.
 * @param {Object} [properties={}] - Key/value pairs to set as attributes.
 */
function setElementAttributes(element, properties = {}) {
    Object.entries(properties).forEach(([key, value]) => {
        if (key === 'classes') {
            if (Array.isArray(value)) {
                value.forEach(cls => element.classList.add(cls));
            }
            return;
        }

        if (value === false || value === null || value === undefined) {
            return;
        }

        element.setAttribute(key, String(value));
    });
}

/**
 * Show a brief error message using a Bootstrap toast.
 * Gracefully does nothing if the toast container is not present.
 * @param {string} message - The error message to display.
 */
function showErrorToast(message) {
    var container = document.getElementById('toast-container');
    var toastEl = document.getElementById('error-toast');
    var bodyEl = document.getElementById('error-toast-body');
    if (!container || !toastEl || !bodyEl) return;
    bodyEl.textContent = message;
    var toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
}

/**
 * Extract a readable message from any rejection value.
 * @param {*} error - The rejection value.
 * @returns {string}
 */
function errMsg(error) {
    return error && error.message ? error.message : JSON.stringify(error);
}
