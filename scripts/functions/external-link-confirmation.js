/**
 * External Link Confirmation System
 * Intercepts clicks on external links and shows a confirmation modal
 * before navigating away from the site.
 */

/**
 * Check if a link is an external link that should trigger the confirmation modal.
 * @param {HTMLAnchorElement} link - The anchor element to check.
 * @returns {boolean} True if the link should be intercepted for confirmation.
 */
function shouldConfirmExternalLink(link) {
    if (!link) return false;

    // Only intercept links explicitly marked as external
    if (!link.classList.contains('external-link')) return false;

    const href = link.getAttribute('href');
    if (!href || href === '#') return false;

    // Skip javascript: pseudo-protocol
    if (href.startsWith('javascript:')) return false;

    // Skip mailto: and other non-http protocols
    if (href.startsWith('mailto:')) return false;
    if (href.startsWith('tel:')) return false;

    // Skip if the link has special attributes
    if (link.hasAttribute('download')) return false;
    if (link.hasAttribute('onclick')) return false;

    // If it's actually an internal page, don't show the external confirmation
    // (let page-transition handle it instead)
    if (typeof isInternalPage === 'function' && isInternalPage(href)) return false;

    return true;
}

/**
 * Show the external link confirmation modal.
 * Populates the URL display, syncs the new-tab toggle with localStorage,
 * and shows the Bootstrap modal.
 * @param {string} url - The target URL to display and navigate to.
 */
function showExternalLinkConfirmation(url) {
    const modalElement = document.getElementById('external-link-confirmation-modal');
    if (!modalElement) {
        // Fallback: navigate directly if modal is not available
        navigateToExternalUrl(url);
        return;
    }

    // Store the target URL for use by the "Open" button handler
    modalElement._confirmUrl = url;

    // Display the target URL
    const urlDisplay = document.getElementById('external-link-url-display');
    if (urlDisplay) {
        urlDisplay.textContent = url;
    }

    // Sync the new-tab toggle with localStorage
    const toggle = document.getElementById('external-link-new-tab-toggle');
    if (toggle) {
        toggle.checked = typeof isExternalLinkNewTabEnabled === 'function'
            ? isExternalLinkNewTabEnabled()
            : true;
    }

    // Show the modal
    const bootstrapModal = new bootstrap.Modal(modalElement);
    bootstrapModal.show();
}

/**
 * Navigate to the external URL based on the current toggle state.
 * If the toggle is on, opens in a new tab; otherwise navigates in the current tab.
 * @param {string} url - The target URL.
 */
function navigateToExternalUrl(url) {
    const toggle = document.getElementById('external-link-new-tab-toggle');
    const openInNewTab = toggle ? toggle.checked : (
        typeof isExternalLinkNewTabEnabled === 'function'
            ? isExternalLinkNewTabEnabled()
            : true
    );

    if (openInNewTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        window.location.href = url;
    }
}

/**
 * Handle the "Open" button click in the external link confirmation modal.
 * Navigates to the stored URL and hides the modal.
 */
function handleExternalLinkConfirm() {
    const modalElement = document.getElementById('external-link-confirmation-modal');
    if (!modalElement || !modalElement._confirmUrl) return;

    const url = modalElement._confirmUrl;
    navigateToExternalUrl(url);

    // Hide the modal
    const instance = bootstrap.Modal.getInstance(modalElement);
    if (instance) {
        instance.hide();
    }
}

/**
 * Handle changes to the new-tab toggle inside the confirmation modal.
 * Persists the preference to localStorage immediately.
 */
function handleExternalLinkToggleChange() {
    const toggle = document.getElementById('external-link-new-tab-toggle');
    if (!toggle) return;

    const checked = toggle.checked;
    if (typeof setExternalLinkNewTabPreference === 'function') {
        setExternalLinkNewTabPreference(checked);
    }
    if (typeof applyAllExternalLinkTargetBehavior === 'function') {
        applyAllExternalLinkTargetBehavior();
    }
}

/**
 * Handle click events on external links.
 * Shows the confirmation modal before navigating away.
 * @param {MouseEvent} e - The click event object.
 */
function handleExternalLinkClick(e) {
    // Skip if user is holding modifier keys (open in new tab/window)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Skip if it's not a left-click
    if (e.button !== 0) return;

    const link = e.target.closest('a');
    if (!link) return;

    if (!shouldConfirmExternalLink(link)) return;

    e.preventDefault();
    showExternalLinkConfirmation(link.href);
}

/**
 * Initialize the external link confirmation system.
 * Sets up the delegated click listener and modal event handlers.
 */
function initExternalLinkConfirmation() {
    // Delegated click listener for external links
    document.addEventListener('click', handleExternalLinkClick);

    // Toggle change handler inside the confirmation modal
    document.addEventListener('change', function (e) {
        if (e.target && e.target.id === 'external-link-new-tab-toggle') {
            handleExternalLinkToggleChange();
        }
    });

    // "Open" button click handler inside the confirmation modal
    document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'external-link-open-btn') {
            e.preventDefault();
            handleExternalLinkConfirm();
        }
    });
}
