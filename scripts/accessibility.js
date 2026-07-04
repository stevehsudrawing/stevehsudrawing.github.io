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

function addEventListenerToTitleLinkAnchors() {
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

function activateSkipButton() {
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
        if (e.target && e.target.id === 'skipButton') {
            // If focus landed on the skip button but pointer mode is active, switch to keyboard mode
            if (!root.classList.contains('user-input-keyboard')) {
                // Prefer :focus-visible in modern browsers; this is a safe fallback
                setKeyboardMode();
            }
        }
    });
}

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

function initCopyLinkTooltips() {
    try {
        const copyLinks = document.querySelectorAll('.copy-link');
        copyLinks.forEach(link => {
            // Set Bootstrap tooltip attributes
            link.setAttribute('data-bs-toggle', 'tooltip');
            link.setAttribute('data-bs-trigger', 'hover focus');
            link.setAttribute('data-i18n-tooltip', 'text-click-to-copy');

            // Set initial title from i18n data if available, otherwise use fallback
            const initialTitle = (typeof langData !== 'undefined' && langData['text-click-to-copy'])
                ? langData['text-click-to-copy']
                : 'Click to Copy';
            link.setAttribute('data-bs-title', initialTitle);

            // Click handler: copy to clipboard, show "Copied!" feedback, restore after 3s
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const copyText = link.getAttribute('data-copy-text');
                if (!copyText) return;

                navigator.clipboard.writeText(copyText).then(() => {
                    const tooltipInstance = bootstrap.Tooltip.getInstance(link);
                    const copiedText = (typeof langData !== 'undefined' && langData['text-copied'])
                        ? langData['text-copied']
                        : 'Copied!';

                    if (tooltipInstance) {
                        tooltipInstance.setContent({ '.tooltip-inner': copiedText });
                        tooltipInstance.show();

                        // Restore original tooltip text after 3 seconds
                        setTimeout(() => {
                            const originalText = (typeof langData !== 'undefined' && langData['text-click-to-copy'])
                                ? langData['text-click-to-copy']
                                : 'Click to Copy';
                            if (tooltipInstance) {
                                tooltipInstance.setContent({ '.tooltip-inner': originalText });
                                tooltipInstance.hide();
                            }
                        }, 3000);
                    }
                }).catch(err => {
                    console.error('Failed to copy text:', err);
                });
            });
        });
    } catch (error) {
        console.error('Failed to initialize copy link tooltips:', error);
    }
}