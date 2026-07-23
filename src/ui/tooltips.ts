/**
 * Bootstrap Tooltip lifecycle management.
 * Handles generic tooltip activation/disposal and copy-link tooltips
 * with click-to-copy clipboard behavior.
 */

import { AppEvent } from '../types/app.js';
import { translate } from '../core/i18n.js';
import { showToast } from '../core/utils.js';

/** True when the primary input cannot hover (touchscreens). */
const isTouchDevice = window.matchMedia('(any-hover: none)').matches;

/**
 * Create Bootstrap Tooltip instances for every element that has
 * the data-bs-toggle="tooltip" attribute.
 * Skipped on touch devices — tooltips cannot be dismissed on touchscreens
 * and will persist as orphaned overlays blocking interaction.
 */
export function initAllTooltips(): void {
    if (isTouchDevice) return;
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(el => createTooltip(el));
}

/**
 * Dispose all active Bootstrap Tooltip instances on the page.
 * Useful before page transitions to prevent orphaned tooltips.
 */
export function disposeAllTooltips(): void {
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(el => disposeTooltip(el));
}

/**
 * Create a Bootstrap Tooltip instance on a single element.
 * Disposes any existing tooltip on the element first (idempotent).
 * @param element - The element to attach the tooltip to.
 * @returns The new tooltip instance.
 */
export function createTooltip(element: Element): bootstrap.Tooltip {
    disposeTooltip(element);
    return new window.bootstrap.Tooltip(element);
}

/**
 * Dispose a Bootstrap Tooltip instance from a single element, if one exists.
 * @param element - The element to remove the tooltip from.
 */
export function disposeTooltip(element: Element): void {
    const instance = window.bootstrap.Tooltip.getInstance(element);
    if (instance) {
        instance.dispose();
    }
}

/**
 * Click handler for .copy-link elements.
 * Copies the text from data-copy-text to the clipboard, then shows
 * a success toast on both desktop and mobile (tooltip is unreliable
 * on touchscreens and may persist as an orphaned overlay).
 * @param e - The click event.
 */
export function handleCopyLinkClick(e: MouseEvent): void {
    e.preventDefault();
    const link = e.currentTarget as HTMLElement;
    const copyText = link.getAttribute('data-copy-text');
    if (!copyText) return;

    navigator.clipboard.writeText(copyText).then(function () {
        const copiedText = translate('text-copied', 'Copied!');
        showToast('success', copiedText);
    }).catch(function (err) {
        showToast('error', 'Failed to copy text');
        console.error('Failed to copy text:', err);
    });
}

/**
 * Initialize the click-to-copy listener on a single .copy-link element.
 * Separate from tooltip decoration so the copy behavior works on both
 * desktop and mobile (tooltip is skipped on touchscreens).
 * @param link - The .copy-link element to initialize.
 */
export function initCopyLinkClick(link: HTMLAnchorElement): void {
    link.addEventListener('click', handleCopyLinkClick);
}

/**
 * Remove the click-to-copy listener from a single .copy-link element.
 * @param link - The .copy-link element to dispose.
 */
export function disposeCopyLinkClick(link: HTMLAnchorElement): void {
    link.removeEventListener('click', handleCopyLinkClick);
}

/**
 * Decorate a single .copy-link element with Bootstrap tooltip attributes.
 * Only called on desktop — touchscreens skip tooltip initialization.
 * @param link - The .copy-link element to decorate.
 */
export function initCopyLinkTooltip(link: HTMLAnchorElement): void {
    link.setAttribute('data-bs-toggle', 'tooltip');
    link.setAttribute('data-bs-trigger', 'hover focus');
    link.setAttribute('data-i18n-tooltip', 'text-click-to-copy');

    const initialTitle = translate('text-click-to-copy', 'Click to Copy');
    link.setAttribute('data-bs-title', initialTitle);
}

/**
 * Remove Bootstrap tooltip decoration and click listener from a single
 * .copy-link element.
 * @param link - The .copy-link element to dispose.
 */
export function disposeCopyLinkTooltip(link: HTMLAnchorElement): void {
    disposeCopyLinkClick(link);
    link.removeAttribute('data-bs-toggle');
    link.removeAttribute('data-bs-trigger');
    link.removeAttribute('data-i18n-tooltip');
    link.removeAttribute('data-bs-title');
    disposeTooltip(link);
}

/**
 * Initialize click-to-copy behavior on all .copy-link elements.
 * On desktop, also attaches tooltip decoration.
 * Delegates to initCopyLinkClick() + initCopyLinkTooltip().
 */
export function initAllCopyLinkTooltips(): void {
    try {
        const links = document.querySelectorAll<HTMLAnchorElement>('.copy-link');
        // Copy behavior: all devices
        links.forEach(initCopyLinkClick);
        // Tooltip decoration: desktop only
        if (!isTouchDevice) {
            links.forEach(initCopyLinkTooltip);
        }
    } catch (error) {
        console.error('Failed to initialize copy link tooltips:', error);
    }
}

/**
 * Update tooltip titles from i18n data attributes and recreate active
 * tooltip instances so they pick up the new title text.
 * Called automatically when the 'pageTextUpdated' event fires.
 */
export function updateAllTooltipTitles(): void {
    document.querySelectorAll('[data-bs-toggle="tooltip"][data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        const translated = translate(key!);
        if (translated) {
            el.setAttribute('data-bs-title', translated);
            if (window.bootstrap.Tooltip.getInstance(el)) {
                createTooltip(el);
            }
        }
    });
}

/**
 * Listen for the 'pageTextUpdated' custom event dispatched by i18n.js
 * and refresh tooltip titles in response to language changes.
 * Call once during page initialization.
 */
export function initTooltipI18nListener(): void {
    document.addEventListener(AppEvent.PageTextUpdated, updateAllTooltipTitles);
}
