/**
 * Accessibility helpers.
 * Handles smooth-scroll to hash targets, keyboard/pointer mode switching,
 * skip-button activation, and external link indicators.
 */

/**
 * Smooth-scroll the page to an element identified by a hash fragment.
 * @param hash - The hash fragment (with or without leading '#').
 * @param instant - If true, scroll instantly instead of smoothly.
 */
export function scrollToHashTarget(hash: string, instant = false): void {
    if (!hash) return;
    if (hash.startsWith('#')) {
        hash = hash.slice(1);
    }

    const target = document.getElementById(hash);
    if (!target) return;

    const offset = 64;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const scrollTop = Math.max(0, targetTop - offset);
    window.scrollTo({ top: scrollTop, behavior: instant ? 'auto' : 'smooth' });
}

/**
 * Click handler for .title-link-anchor elements.
 * Scrolls smoothly to the target heading and updates the URL hash via pushState.
 * @param e - The click event.
 */
export function handleTitleLinkAnchorClick(e: MouseEvent): void {
    e.preventDefault();
    const hash = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
    if (hash) {
        history.pushState(null, '', hash);
        scrollToHashTarget(hash);
    }
}

/**
 * Attach the click listener to a single .title-link-anchor element.
 * @param anchor - The anchor element to initialize.
 */
export function initTitleLinkAnchor(anchor: HTMLAnchorElement): void {
    anchor.addEventListener('click', handleTitleLinkAnchorClick);
}

/**
 * Remove the click listener from a single .title-link-anchor element.
 * @param anchor - The anchor element to dispose.
 */
export function disposeTitleLinkAnchor(anchor: HTMLAnchorElement): void {
    anchor.removeEventListener('click', handleTitleLinkAnchorClick);
}

/**
 * Attach click listeners to all .title-link-anchor elements so they scroll
 * smoothly to the corresponding heading and update the URL hash via pushState.
 * Delegates to initTitleLinkAnchor() for each matching element.
 */
export function initAllTitleLinkAnchors(): void {
    try {
        document.querySelectorAll<HTMLAnchorElement>('.title-link-anchor').forEach(initTitleLinkAnchor);
    } catch (error) {
        console.error('Failed to add event listener to title link anchors:', error);
    }
}

/**
 * Activate the skip-to-main-content button and manage keyboard vs pointer
 * input mode classes on the root element for focus-visible styling.
 */
export function initSkipButton(): void {
    const root = document.documentElement;

    function setKeyboardMode(): void {
        root.classList.add('user-input-keyboard');
        root.classList.remove('user-input-pointer');
    }

    function setPointerMode(): void {
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
        if ((e.target as HTMLElement)?.id === 'skip-button') {
            // If focus landed on the skip button but pointer mode is active, switch to keyboard mode
            if (!root.classList.contains('user-input-keyboard')) {
                // Prefer :focus-visible in modern browsers; this is a safe fallback
                setKeyboardMode();
            }
        }
    });
}

/**
 * Append an arrow-up-right icon to a single .external-link anchor
 * so users can visually identify links that leave the site.
 * Skips links with no visible text content. Idempotent: does nothing
 * if the icon already exists.
 * @param link - The link element to add the indicator to.
 */
export function addExternalLinkIndicator(link: HTMLAnchorElement): void {
    // Skip links that have no visible text content
    const textContent = link.textContent?.trim();
    if (!textContent) return;

    // Avoid adding duplicate icons
    if (link.querySelector('i.bi-arrow-up-right')) return;

    const icon = document.createElement('i');
    icon.className = 'bi bi-arrow-up-right external-link-icon';
    link.appendChild(document.createTextNode(' '));
    link.appendChild(icon);
}

/**
 * Remove the arrow-up-right icon from a single .external-link anchor,
 * along with the space text node that precedes it.
 * @param link - The link element to remove the indicator from.
 */
export function removeExternalLinkIndicator(link: HTMLAnchorElement): void {
    const icon = link.querySelector('i.bi-arrow-up-right');
    if (!icon) return;

    // Remove the space text node before the icon, if present
    const prev = icon.previousSibling;
    if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent === ' ') {
        prev.remove();
    }
    icon.remove();
}

/**
 * Append arrow-up-right icons to all .external-link anchors on the page.
 * Delegates to addExternalLinkIndicator() for each matching element.
 */
export function addAllExternalLinkIndicators(): void {
    try {
        document.querySelectorAll<HTMLAnchorElement>('a.external-link').forEach(addExternalLinkIndicator);
    } catch (error) {
        console.error('Failed to add external link indicators:', error);
    }
}
