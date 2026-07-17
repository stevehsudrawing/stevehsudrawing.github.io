/**
 * No-copy protection.
 * Prevents right-click / long-press context menus and drag-to-open
 * (e.g. dragging an image to a new tab) on .no-copy elements.
 * CSS handles user-select, iOS callout, and WebKit image drag;
 * this module handles the JS-side contextmenu and dragstart events.
 */

/**
 * Initialize contextmenu and dragstart prevention on .no-copy elements
 * via event delegation.  Call this once after DOM is ready — it uses
 * delegated listeners on the document, so dynamically added .no-copy
 * elements are covered automatically.
 */
function initNoCopyProtection() {
    try {
        // Prevent right-click / long-press context menu
        document.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.no-copy')) {
                e.preventDefault();
            }
        });

        // Prevent dragging images out of the page (e.g. to a new tab)
        document.addEventListener('dragstart', function (e) {
            if (e.target.closest('.no-copy')) {
                e.preventDefault();
            }
        });
    } catch (error) {
        console.error('Failed to initialize no-copy protection:', error);
    }
}
