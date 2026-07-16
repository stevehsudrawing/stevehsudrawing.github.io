/**
 * No-copy protection.
 * Prevents right-click / long-press context menus on .no-copy elements.
 * CSS handles user-select and iOS callout; this module handles the JS-side
 * contextmenu event for both desktop and mobile.
 */

/**
 * Initialize contextmenu prevention on .no-copy elements via event delegation.
 * Call this once after DOM is ready — it uses a single delegated listener
 * on the document, so dynamically added .no-copy elements are covered.
 */
function initNoCopyProtection() {
    try {
        document.addEventListener('contextmenu', function (e) {
            if (e.target.closest('.no-copy')) {
                e.preventDefault();
            }
        });
    } catch (error) {
        console.error('Failed to initialize no-copy protection:', error);
    }
}
