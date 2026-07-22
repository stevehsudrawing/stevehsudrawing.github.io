/**
 * Horizontal scroll hint.
 * Detects overflowing .link-button-group containers and shows a
 * "Scroll Horizontally" hint below them so users know they can swipe.
 */

import { translate, updatePageText } from '../core/i18n.js';

export let scrollHintResizeSetup = false;

/**
 * Show or hide the horizontal scroll hint below each .link-button-group
 * depending on whether it overflows its container.
 */
export function updateScrollHints() {
    document.querySelectorAll('.link-button-group').forEach(group => {
        const hint = group.nextElementSibling;
        if (!hint || !hint.classList.contains('scroll-hint')) return;
        const overflows = group.scrollWidth > group.clientWidth;
        if (overflows) {
            hint.classList.add('visible');
        } else {
            hint.classList.remove('visible');
        }
    });
}

/**
 * Create a "Scroll Horizontally" hint element after a single .link-button-group.
 * Idempotent: does nothing if a hint already exists after the group.
 * @param {HTMLElement} group - The .link-button-group container.
 */
export function createScrollHint(group) {
    let hint = group.nextElementSibling;
    if (hint && hint.classList.contains('scroll-hint')) return;

    hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<i class="bi bi-chevron-left"></i> <span data-i18n="text-scroll-horizontally">Scroll Horizontally</span> <i class="bi bi-chevron-right"></i>';
    group.insertAdjacentElement('afterend', hint);

    // Manually set translated text since updatePageText() has already run
    const span = hint.querySelector('[data-i18n]');
    if (span) {
        const translated = translate('text-scroll-horizontally');
        if (translated) {
            span.textContent = translated;
        }
    }
}

/**
 * Remove the scroll hint element after a single .link-button-group.
 * @param {HTMLElement} group - The .link-button-group container.
 */
export function removeScrollHint(group) {
    const hint = group.nextElementSibling;
    if (hint && hint.classList.contains('scroll-hint')) {
        hint.remove();
    }
}

/**
 * Create scroll hint elements after every .link-button-group on the page
 * and listen for resize events to toggle their visibility.
 * Delegates to createScrollHint() for each matching element.
 */
export function initAllScrollHints() {
    const buttonGroups = document.querySelectorAll('.link-button-group');
    if (buttonGroups.length === 0) return;

    buttonGroups.forEach(createScrollHint);
    updateScrollHints();

    // Set up resize listener only once globally
    if (!scrollHintResizeSetup) {
        scrollHintResizeSetup = true;
        let resizeTicking = false;
        window.addEventListener('resize', function () {
            if (!resizeTicking) {
                requestAnimationFrame(function () {
                    updateScrollHints();
                    resizeTicking = false;
                });
                resizeTicking = true;
            }
        });
    }
}
