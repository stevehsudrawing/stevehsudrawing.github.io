/**
 * Utility functions.
 * Provides shared helpers for some logic used across multiple modules.
 */

/**
 * Normalize a URL pathname so that the root maps to /index.html.
 * @param pathname - e.g. "/", "", "/about.html"
 * @returns e.g. "/index.html", "/about.html"
 */
export function normalizeInternalPath(pathname: string): string {
    if (pathname === '/' || pathname === '') return '/index.html';
    return pathname;
}

/**
 * Extract the page name (without .html extension) from a pathname.
 * The root path maps to "index".
 * @param pathname - e.g. "/", "/about.html", "/artworks-and-videos.html"
 * @returns e.g. "index", "about", "artworks-and-videos"
 */
export function extractPageName(pathname: string): string {
    const normalized = normalizeInternalPath(pathname);
    // normalized is like "/index.html" or "/about.html"
    const filename = normalized.split('/').pop();
    return filename!.replace(/\.html$/, '');
}

/**
 * Properties object for hast-style element attribute setting.
 * Supports className (string or string[]), camelCase data* keys,
 * and values of false/null/undefined are skipped.
 */
export interface HastProperties {
    className?: string | string[];
    [key: string]: unknown;
}

/**
 * Set multiple attributes and/or classes on a DOM element from a properties object.
 * Special handling: 'className' can be a string or array and is added via classList.
 * camelCase data* keys (hast convention) are converted to data-* kebab-case.
 * Values of false, null, or undefined are skipped.
 * @param element - The target element.
 * @param properties - Key/value pairs to set as attributes.
 */
export function setElementAttributes(
    element: HTMLElement,
    properties: HastProperties = {}
): void {
    Object.entries(properties).forEach(([key, value]) => {
        if (key === 'className') {
            if (Array.isArray(value)) {
                (value as string[]).forEach(cls => element.classList.add(cls));
            }
            return;
        }

        if (value === false || value === null || value === undefined) {
            return;
        }

        // Convert camelCase data* keys to data-* kebab-case (hast convention).
        // e.g. dataImgFeature -> data-img-feature, dataI18n -> data-i18n.
        const attrName = /^data[A-Z]/.test(key)
            ? key.replace(/^data([A-Z])/, (_, c: string) => 'data-' + c.toLowerCase())
                .replace(/[A-Z]/g, m => '-' + m.toLowerCase())
            : key;

        element.setAttribute(attrName, String(value));
    });
}

/**
 * Show a brief error message using a Bootstrap toast.
 * Gracefully does nothing if the toast container is not present.
 * @param message - The error message to display.
 */
export function showErrorToast(message: string): void {
    const container = document.getElementById('toast-container');
    const toastEl = document.getElementById('error-toast');
    const bodyEl = document.getElementById('error-toast-body');
    if (!container || !toastEl || !bodyEl) return;
    bodyEl.textContent = message;
    const toast = window.bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
}

/**
 * Extract a readable message from any rejection value.
 * @param error - The rejection value.
 */
export function errMsg(error: unknown): string {
    return error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error);
}

/**
 * List of internal page paths that support page transitions.
 */
export const INTERNAL_PAGES: string[] = [
    '/index.html',
    '/about.html',
    '/artworks-and-videos.html',
    '/blogs-and-sponsor.html',
    '/chatting.html',
    '/softwares.html'
];

/**
 * List of page paths excluded from the page transition system.
 * These pages will always trigger a full browser navigation.
 */
export const EXCLUDED_PAGES: string[] = [
    '/404.html',
    '/error-javascript-disabled.html',
    '/error-unsupported-browser.html'
];

/**
 * Determine if a URL is an internal page that should be handled by the transition system.
 * @param url - The URL to check, can be relative or absolute.
 * @returns True if the URL points to an internal page eligible for transitions.
 */
export function isInternalPage(url: string): boolean {
    try {
        const target = new URL(url, window.location.origin);
        // Must be same origin
        if (target.origin !== window.location.origin) return false;
        // Must be one of our known internal pages
        const path = target.pathname;
        return INTERNAL_PAGES.includes(path) && !EXCLUDED_PAGES.includes(path);
    } catch {
        return false;
    }
}
