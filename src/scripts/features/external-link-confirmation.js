/**
 * External Link Confirmation System
 * Intercepts clicks on external links and shows a confirmation modal
 * before navigating away from the site.
 */

import { applyColoredImage, markImageLoaded } from '../core/img-utils.js';
import { showQRCodeModal } from './qr-code.js';
import { applyAllExternalLinkTargetBehavior, isExternalLinkNewTabEnabled, setExternalLinkNewTabPreference } from '../ui/settings.js';
import { isInternalPage, setElementAttributes } from '../core/utils.js';

/**
 * Check if a link is an external link that should trigger the confirmation modal.
 * @param {HTMLAnchorElement} link - The anchor element to check.
 * @returns {boolean} True if the link should be intercepted for confirmation.
 */
export function shouldConfirmExternalLink(link) {
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
 * Populates the URL display, optionally renders a link icon, syncs the
 * new-tab toggle with localStorage, and shows the Bootstrap modal.
 * @param {string} url - The target URL to display and navigate to.
 * @param {Object} [imgProperties] - Optional hast-format icon properties
 *   (passed through to showQRCodeModal for the QR button and rendered
 *   as a coloured icon next to the URL).
 */
export function showExternalLinkConfirmation(url, imgProperties) {
    const modalElement = document.getElementById('external-link-confirmation-modal');
    if (!modalElement) {
        // Fallback: navigate directly if modal is not available
        navigateToExternalUrl(url);
        return;
    }

    // Store the target URL and icon properties for use by button handlers
    modalElement._confirmUrl = url;
    modalElement._confirmIconProps = imgProperties || null;

    // Display the target URL
    const urlDisplay = document.getElementById('external-link-url-display');
    if (urlDisplay) {
        urlDisplay.textContent = url;
    }

    // Render the icon if provided
    const iconContainer = document.getElementById('external-link-icon-container');
    if (iconContainer) {
        iconContainer.innerHTML = '';
        if (imgProperties) {
            iconContainer.classList.remove('d-none');
            const img = document.createElement('img');
            setElementAttributes(img, imgProperties);
            img.classList.add('img-fluid');
            img.style.width = '32px';
            img.style.height = '32px';
            if (imgProperties.dataImgFeature === 'colored') {
                applyColoredImage(img);
            }
            markImageLoaded(img);
            iconContainer.appendChild(img);
        } else {
            iconContainer.classList.add('d-none');
        }
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
export function navigateToExternalUrl(url) {
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
export function handleExternalLinkConfirm() {
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
export function handleExternalLinkToggleChange() {
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
export function handleExternalLinkClick(e) {
    // Skip if user is holding modifier keys (open in new tab/window)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Skip if it's not a left-click
    if (e.button !== 0) return;

    const link = e.target.closest('a');
    if (!link) return;

    if (!shouldConfirmExternalLink(link)) return;

    e.preventDefault();

    // Read optional icon properties for the confirmation modal.
    const imgPropsJson = link.getAttribute('data-link-img-props');
    const imgProperties = imgPropsJson ? JSON.parse(imgPropsJson) : null;
    showExternalLinkConfirmation(link.href, imgProperties);
}

/**
 * Handle the "Show QR Code" button click in the external link confirmation modal.
 * Hides the confirmation modal and opens the QR code modal for the same URL.
 */
export function handleExternalLinkShowQR() {
    const modalElement = document.getElementById('external-link-confirmation-modal');
    if (!modalElement) return;

    const url = modalElement._confirmUrl;
    const iconProps = modalElement._confirmIconProps;

    // Hide the confirmation modal, then show the QR code modal after
    // the hide transition completes.
    const instance = bootstrap.Modal.getInstance(modalElement);
    if (instance) {
        modalElement.addEventListener('hidden.bs.modal', function handler() {
            modalElement.removeEventListener('hidden.bs.modal', handler);
            if (typeof showQRCodeModal === 'function') {
                if (iconProps) {
                    showQRCodeModal(url, iconProps);
                } else {
                    showQRCodeModal(url);
                }
            }
        });
        instance.hide();
    }
}

/**
 * Initialize the external link confirmation system.
 * Sets up the delegated click listener and modal event handlers.
 */
export function initExternalLinkConfirmation() {
    // Delegated click listener for external links
    document.addEventListener('click', handleExternalLinkClick);

    // Toggle change handler inside the confirmation modal
    document.addEventListener('change', function (e) {
        if (e.target?.id === 'external-link-new-tab-toggle') {
            handleExternalLinkToggleChange();
        }
    });

    // "Open" button click handler inside the confirmation modal
    document.addEventListener('click', function (e) {
        if (e.target?.id === 'external-link-open-btn') {
            e.preventDefault();
            handleExternalLinkConfirm();
        }
    });

    // "Show QR Code" button click handler inside the confirmation modal
    document.addEventListener('click', function (e) {
        const qrBtn = e.target.closest('#external-link-qr-btn');
        if (qrBtn) {
            e.preventDefault();
            handleExternalLinkShowQR();
        }
    });
}
