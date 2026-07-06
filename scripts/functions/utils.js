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
