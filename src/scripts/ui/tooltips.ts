/**
 * Bootstrap Tooltip lifecycle management.
 * Handles generic tooltip activation/disposal and copy-link tooltips
 * with click-to-copy clipboard behavior.
 */

import { translate } from '../core/i18n.js';
import { showErrorToast } from '../core/utils.js';

/**
 * Create Bootstrap Tooltip instances for every element that has
 * the data-bs-toggle="tooltip" attribute.
 */
export function initAllTooltips(): void {
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
 * a "Copied!" tooltip for 3 seconds before restoring the original title.
 * @param e - The click event.
 */
export function handleCopyLinkClick(e: MouseEvent): void {
    e.preventDefault();
    const link = e.currentTarget as HTMLElement;
    const copyText = link.getAttribute('data-copy-text');
    if (!copyText) return;

    navigator.clipboard.writeText(copyText).then(function () {
        const tooltipInstance = window.bootstrap.Tooltip.getInstance(link);
        const copiedText = translate('text-copied', 'Copied!');

        if (tooltipInstance) {
            tooltipInstance.setContent({ '.tooltip-inner': copiedText });
            tooltipInstance.show();

            // Restore original tooltip text after 3 seconds
            setTimeout(function () {
                const originalText = translate('text-click-to-copy', 'Click to Copy');
                if (tooltipInstance) {
                    tooltipInstance.setContent({ '.tooltip-inner': originalText });
                    tooltipInstance.hide();
                }
            }, 3000);
        }
    }).catch(function (err) {
        showErrorToast('Failed to copy text');
        console.error('Failed to copy text:', err);
    });
}

/**
 * Initialize Bootstrap tooltip and click-to-copy behavior on a single .copy-link element.
 * Sets tooltip attributes, initial title, and attaches the copy click handler.
 * @param link - The .copy-link element to initialize.
 */
export function initCopyLinkTooltip(link: HTMLAnchorElement): void {
    link.setAttribute('data-bs-toggle', 'tooltip');
    link.setAttribute('data-bs-trigger', 'hover focus');
    link.setAttribute('data-i18n-tooltip', 'text-click-to-copy');

    const initialTitle = translate('text-click-to-copy', 'Click to Copy');
    link.setAttribute('data-bs-title', initialTitle);

    link.addEventListener('click', handleCopyLinkClick);
}

/**
 * Dispose the Bootstrap tooltip and click-to-copy behavior from a single .copy-link element.
 * Removes the click handler, tooltip attributes, and disposes the Bootstrap Tooltip instance.
 * @param link - The .copy-link element to dispose.
 */
export function disposeCopyLinkTooltip(link: HTMLAnchorElement): void {
    link.removeEventListener('click', handleCopyLinkClick);
    link.removeAttribute('data-bs-toggle');
    link.removeAttribute('data-bs-trigger');
    link.removeAttribute('data-i18n-tooltip');
    link.removeAttribute('data-bs-title');
    disposeTooltip(link);
}

/**
 * Initialize Bootstrap tooltips and click-to-copy behavior on all .copy-link elements.
 * Delegates to initCopyLinkTooltip() for each matching element.
 */
export function initAllCopyLinkTooltips(): void {
    try {
        document.querySelectorAll<HTMLAnchorElement>('.copy-link').forEach(initCopyLinkTooltip);
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
    document.addEventListener('pageTextUpdated', updateAllTooltipTitles);
}
