/**
 * Accessibility helpers.
 * Handles smooth-scroll to hash targets, keyboard/pointer mode switching,
 * skip-button activation, and external link indicators.
 */

/**
 * Smooth-scroll the page to an element identified by a hash fragment.
 * @param {string} hash - The hash fragment (with or without leading '#').
 * @param {boolean} [instant=false] - If true, scroll instantly instead of smoothly.
 */
function scrollToHashTarget(hash, instant = false) {
    if (!hash) return;
    if (hash.startsWith('#')) {
        hash = hash.slice(1);
    }

    const target = document.getElementById(hash);
    if (!target) return;

    const offset = 64;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset;
    const scrollTop = Math.max(0, targetTop - offset);
    window.scrollTo({ top: scrollTop, behavior: instant ? 'auto' : 'smooth' });
}

/**
 * Attach click listeners to .title-link-anchor elements so they scroll
 * smoothly to the corresponding heading and update the URL hash via pushState.
 */
function initTitleLinkAnchors() {
    try {
        const titleLinkAnchors = document.querySelectorAll('.title-link-anchor');
        titleLinkAnchors.forEach(titleAnchor => {
            titleAnchor.addEventListener('click', event => {
                event.preventDefault();
                const hash = titleAnchor.getAttribute('href');
                history.pushState(null, '', hash);
                scrollToHashTarget(hash);
            })
        })
    } catch (error) {
        console.error('Failed to add event listener to title link anchors:', error);
    }
}

/**
 * Activate the skip-to-main-content button and manage keyboard vs pointer
 * input mode classes on the root element for focus-visible styling.
 */
function initSkipButton() {
    const root = document.documentElement;

    function setKeyboardMode() {
        root.classList.add('user-input-keyboard');
        root.classList.remove('user-input-pointer');
    }

    function setPointerMode() {
        root.classList.remove('user-input-keyboard');
        root.classList.add('user-input-pointer');
    }

    // Keyboard navigation (Tab) should enable keyboard mode
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            setKeyboardMode();
        }
    }, true);

    // Any pointer interaction disables keyboard-only display
    ['mousedown', 'pointerdown', 'touchstart'].forEach(evt => {
        document.addEventListener(evt, setPointerMode, true);
    });

    // Optional: on focus of skip button ensure keyboard class present for older browsers
    document.addEventListener('focusin', function (e) {
        if (e.target && e.target.id === 'skip-button') {
            // If focus landed on the skip button but pointer mode is active, switch to keyboard mode
            if (!root.classList.contains('user-input-keyboard')) {
                // Prefer :focus-visible in modern browsers; this is a safe fallback
                setKeyboardMode();
            }
        }
    });
}

/**
 * Append an arrow-up-right icon to all .external-link anchors
 * so users can visually identify links that leave the site.
 */
function addExternalLinkIndicators() {
    try {
        document.querySelectorAll('a.external-link').forEach(link => {
            // Skip links that have no visible text content
            const textContent = link.textContent.trim();
            if (!textContent) return;

            // Avoid adding duplicate icons
            if (!link.querySelector('i.bi-arrow-up-right')) {
                const icon = document.createElement('i');
                icon.className = 'bi bi-arrow-up-right';
                link.appendChild(document.createTextNode(' '));
                link.appendChild(icon);
            }
        });
    } catch (error) {
        console.error('Failed to add external link indicators:', error);
    }
}