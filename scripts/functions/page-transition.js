/**
 * Page Transition System
 * Provides SPA-like smooth transitions between internal pages
 * by fetching and replacing only the #page-content element.
 */

/**
 * Flag indicating whether a page transition is currently in progress.
 * Used to prevent concurrent transitions.
 * @type {boolean}
 */
let isTransitioning = false;

/**
 * Check if a clicked link should be handled by the transition system.
 * @param {HTMLAnchorElement} link - The anchor element to check.
 * @returns {boolean} True if the link should be intercepted for page transition.
 */
function shouldInterceptLink(link) {
    if (!link) return false;

    // For predefined links, a direct return is possible
    if (link.classList.contains('internal-link')) return true;
    if (link.classList.contains('external-link')) return false;

    const href = link.getAttribute('href');
    if (!href || href === '#') return false;

    // Skip javascript: pseudo-protocol
    if (href.startsWith('javascript:')) return false;

    // Skip hash-only links (page-internal anchors)
    if (href.startsWith('#')) return false;

    // Skip if link has special attributes
    if (link.hasAttribute('target') && link.getAttribute('target') === '_blank') return false;
    if (link.hasAttribute('download')) return false;
    // Skip Bootstrap toggles that interfere with navigation (dropdown, modal, tab, collapse, etc.),
    // but allow tooltip and popover which are just UI hints and don't prevent navigation.
    if (link.hasAttribute('data-bs-toggle')) {
        const toggleValue = link.getAttribute('data-bs-toggle');
        if (toggleValue !== 'tooltip' && toggleValue !== 'popover') return false;
    }
    if (link.hasAttribute('data-lang')) return false;
    if (link.hasAttribute('data-settings-open')) return false;
    if (link.hasAttribute('onclick')) return false;

    // Skip external-link class
    if (link.classList.contains('external-link')) return false;

    // Check if it's an internal page
    if (!isInternalPage(href)) return false;

    return true;
}

/**
 * Start the progress bar animation.
 */
function startProgress() {
    const bar = document.getElementById('page-transition-progress');
    if (!bar) return;
    // Reset
    bar.classList.remove('done');
    bar.style.display = '';
    // Force reflow so the reset takes effect before adding 'active'
    void bar.offsetWidth;
    bar.classList.add('active');
}

/**
 * Complete the progress bar animation and hide it.
 */
function completeProgress() {
    const bar = document.getElementById('page-transition-progress');
    if (!bar) return;
    bar.classList.add('done');
    bar.classList.remove('active');
    // Hide after the completion transition
    setTimeout(() => {
        bar.classList.remove('done');
        bar.style.display = 'none';
    }, 350);
}

/**
 * Dim the page content to indicate loading.
 */
function dimPageContent() {
    const content = document.getElementById('page-content');
    if (content) {
        content.classList.add('transitioning');
    }
}

/**
 * Restore the page content opacity.
 */
function restorePageContent() {
    const content = document.getElementById('page-content');
    if (content) {
        content.classList.remove('transitioning');
    }
}

/**
 * Close the offcanvas sidebar if it's open (mobile navigation).
 */
function closeOffcanvas() {
    try {
        const offcanvasEl = document.getElementById('navbar-offcanvas');
        if (offcanvasEl) {
            const instance = bootstrap.Offcanvas.getInstance(offcanvasEl);
            if (instance) {
                instance.hide();
            }
        }
    } catch {
        // Bootstrap might not be available yet; ignore
    }
}

/**
 * Extract the #page-content inner HTML and <title> from a fetched HTML string.
 * @param {string} htmlString - The full HTML content of a fetched page.
 * @returns {{title: string, contentHTML: string}} An object containing the page title and the inner HTML of #page-content.
 */
function extractPageContent(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const titleEl = doc.querySelector('title');
    const newTitle = titleEl ? titleEl.textContent : document.title;

    const pageContent = doc.getElementById('page-content');
    if (!pageContent) {
        throw new Error('Target page has no #page-content element');
    }

    return {
        title: newTitle,
        contentHTML: pageContent.innerHTML
    };
}

/**
 * Core navigation function.
 * @param {string} url - The target URL
 * @param {boolean} pushState - Whether to push a new history entry
 */
async function navigateTo(url, pushState = true) {
    // Prevent concurrent transitions
    if (isTransitioning) {
        console.warn('Page transition already in progress, ignoring navigation to:', url);
        return;
    }

    // Resolve the full URL to get the pathname for comparison
    let resolvedPath;
    try {
        const resolved = new URL(url, window.location.origin);
        resolvedPath = normalizeInternalPath(resolved.pathname);
    } catch {
        console.error('Invalid URL for navigation:', url);
        return;
    }

    // Don't navigate to the same page - scroll to top instead
    const currentPath = normalizeInternalPath(window.location.pathname);
    if (resolvedPath === currentPath && pushState) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    isTransitioning = true;

    try {
        // 1. Close offcanvas sidebar
        closeOffcanvas();

        // 1.5. Dispose all tooltips to prevent orphaned tooltips
        //      (especially on mobile where tapping triggers both tooltip and navigation)
        disposeAllTooltips();

        // 2. Dim page content + start progress bar
        dimPageContent();
        startProgress();

        // 3. Fetch the target page
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        const htmlString = await response.text();

        // 4. Extract page content and title
        const { title, contentHTML } = extractPageContent(htmlString);

        // 5. Update the page
        document.title = title;
        const pageContentEl = document.getElementById('page-content');
        if (pageContentEl) {
            pageContentEl.innerHTML = contentHTML;
        }

        // 6. Update browser history
        if (pushState) {
            history.pushState({ path: resolvedPath }, title, url);
        }

        // 7. Re-initialize page content (i18n, link cards, tooltips, etc.)
        if (typeof initPageContent === 'function') {
            await initPageContent();
        }

        // 8. Scroll to top or hash target
        if (window.location.hash) {
            scrollToHashTarget(window.location.hash, true);
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // 9. Complete progress bar and restore page content
        completeProgress();
        restorePageContent();

    } catch (error) {
        console.error('Page transition failed:', error);
        // Fall back to full page navigation
        completeProgress();
        restorePageContent();
        isTransitioning = false;
        window.location.href = url;
        return;
    }

    isTransitioning = false;
}

/**
 * Handle click events on internal links.
 * @param {MouseEvent} e - The click event object.
 */
function handleInternalLinkClick(e) {
    // Skip if user is holding modifier keys (open in new tab/window)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Skip if it's not a left-click
    if (e.button !== 0) return;

    const link = e.target.closest('a');
    if (!link) return;

    if (!shouldInterceptLink(link)) return;

    e.preventDefault();
    navigateTo(link.href);
}

/**
 * Initialize the click listener for internal link navigation.
 */
function initPageTransitionLinkClicks() {
    document.addEventListener('click', handleInternalLinkClick);
}

/**
 * Handle browser back/forward navigation.
 * @param {PopStateEvent} e - The popstate event object.
 */
function handlePopState(e) {
    const currentPath = normalizeInternalPath(window.location.pathname);
    if (INTERNAL_PAGES.includes(currentPath)) {
        navigateTo(window.location.href, false);
    }
    // If the popped state is not an internal page, let the browser handle it normally
}

/**
 * Initialize the popstate listener for browser back/forward navigation.
 */
function initPageTransitionPopState() {
    window.addEventListener('popstate', handlePopState);
}
