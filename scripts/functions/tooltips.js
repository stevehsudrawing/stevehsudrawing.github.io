/**
 * Bootstrap Tooltip lifecycle management.
 * Handles generic tooltip activation/disposal and copy-link tooltips
 * with click-to-copy clipboard behavior.
 */

/**
 * Create Bootstrap Tooltip instances for every element that has
 * the data-bs-toggle="tooltip" attribute.
 */
function initAllTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(el => createTooltip(el));
}

/**
 * Dispose all active Bootstrap Tooltip instances on the page.
 * Useful before page transitions to prevent orphaned tooltips.
 */
function disposeAllTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
        .forEach(el => disposeTooltip(el));
}

/**
 * Create a Bootstrap Tooltip instance on a single element.
 * Disposes any existing tooltip on the element first (idempotent).
 * @param {Element} element - The element to attach the tooltip to.
 * @returns {bootstrap.Tooltip} The new tooltip instance.
 */
function createTooltip(element) {
    disposeTooltip(element);
    return new bootstrap.Tooltip(element);
}

/**
 * Dispose a Bootstrap Tooltip instance from a single element, if one exists.
 * @param {Element} element - The element to remove the tooltip from.
 */
function disposeTooltip(element) {
    const instance = bootstrap.Tooltip.getInstance(element);
    if (instance) {
        instance.dispose();
    }
}

/**
 * Click handler for .copy-link elements.
 * Copies the text from data-copy-text to the clipboard, then shows
 * a "Copied!" tooltip for 3 seconds before restoring the original title.
 * @param {MouseEvent} e - The click event.
 */
function handleCopyLinkClick(e) {
    e.preventDefault();
    const link = e.currentTarget;
    const copyText = link.getAttribute('data-copy-text');
    if (!copyText) return;

    navigator.clipboard.writeText(copyText).then(function () {
        const tooltipInstance = bootstrap.Tooltip.getInstance(link);
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
 * @param {HTMLAnchorElement} link - The .copy-link element to initialize.
 */
function initCopyLinkTooltip(link) {
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
 * @param {HTMLAnchorElement} link - The .copy-link element to dispose.
 */
function disposeCopyLinkTooltip(link) {
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
function initAllCopyLinkTooltips() {
    try {
        document.querySelectorAll('.copy-link').forEach(initCopyLinkTooltip);
    } catch (error) {
        console.error('Failed to initialize copy link tooltips:', error);
    }
}
