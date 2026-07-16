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
 * Initialize Bootstrap tooltips on .copy-link elements and wire up
 * click-to-copy behavior with a temporary "Copied!" feedback message.
 */
function initCopyLinkTooltips() {
    try {
        const copyLinks = document.querySelectorAll('.copy-link');
        copyLinks.forEach(link => {
            // Set Bootstrap tooltip attributes
            link.setAttribute('data-bs-toggle', 'tooltip');
            link.setAttribute('data-bs-trigger', 'hover focus');
            link.setAttribute('data-i18n-tooltip', 'text-click-to-copy');

            // Set initial title from i18n data if available, otherwise use fallback
            const initialTitle = translate('text-click-to-copy', 'Click to Copy');
            link.setAttribute('data-bs-title', initialTitle);

            // Click handler: copy to clipboard, show "Copied!" feedback, restore after 3s
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const copyText = link.getAttribute('data-copy-text');
                if (!copyText) return;

                navigator.clipboard.writeText(copyText).then(() => {
                    const tooltipInstance = bootstrap.Tooltip.getInstance(link);
                    const copiedText = translate('text-copied', 'Copied!');

                    if (tooltipInstance) {
                        tooltipInstance.setContent({ '.tooltip-inner': copiedText });
                        tooltipInstance.show();

                        // Restore original tooltip text after 3 seconds
                        setTimeout(() => {
                            const originalText = translate('text-click-to-copy', 'Click to Copy');
                            if (tooltipInstance) {
                                tooltipInstance.setContent({ '.tooltip-inner': originalText });
                                tooltipInstance.hide();
                            }
                        }, 3000);
                    }
                }).catch(err => {
                    showErrorToast('Failed to copy text');
                    console.error('Failed to copy text:', err);
                });
            });
        });
    } catch (error) {
        console.error('Failed to initialize copy link tooltips:', error);
    }
}
