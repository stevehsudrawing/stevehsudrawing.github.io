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