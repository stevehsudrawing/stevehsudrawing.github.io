/**
 * Horizontal scroll hint.
 * Detects overflowing .link-button-group containers and shows a
 * "Scroll Horizontally" hint below them so users know they can swipe.
 */

let scrollHintResizeSetup = false;

/**
 * Show or hide the horizontal scroll hint below each .link-button-group
 * depending on whether it overflows its container.
 */
function updateScrollHints() {
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
 * Create a "Scroll Horizontally" hint element after each .link-button-group
 * and listen for resize events to toggle its visibility.
 */
function initScrollHint() {
    const buttonGroups = document.querySelectorAll('.link-button-group');
    if (buttonGroups.length === 0) return;

    // Create hint elements after each button group
    buttonGroups.forEach(group => {
        let hint = group.nextElementSibling;
        if (!hint || !hint.classList.contains('scroll-hint')) {
            hint = document.createElement('div');
            hint.className = 'scroll-hint';
            hint.setAttribute('aria-hidden', 'true');
            hint.innerHTML = '<i class="bi bi-chevron-left"></i> <span data-i18n="text-scroll-horizontally">Scroll Horizontally</span> <i class="bi bi-chevron-right"></i>';
            group.insertAdjacentElement('afterend', hint);

            // Manually set translated text since updatePageText() has already run
            const span = hint.querySelector('[data-i18n]');
            if (span && typeof langData !== 'undefined' && langData['text-scroll-horizontally']) {
                span.textContent = langData['text-scroll-horizontally'];
            }
        }
    });

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
