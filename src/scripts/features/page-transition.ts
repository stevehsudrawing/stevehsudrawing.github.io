/**
 * Page Transition System
 * Provides SPA-like smooth transitions between internal pages
 * by fetching and replacing only the #page-content element.
 */

import { scrollToHashTarget } from '../core/accessibility.js';
import { disposeAllTooltips } from '../ui/tooltips.js';
import { INTERNAL_PAGES, isInternalPage, normalizeInternalPath } from '../core/utils.js';
import { initPageContent } from './init-page-content.js';

/**
 * Flag indicating whether a page transition is currently in progress.
 * Used to prevent concurrent transitions.
 */
export let isTransitioning = false;

/**
 * Check if a clicked link should be handled by the transition system.
 * @param link - The anchor element to check.
 * @returns True if the link should be intercepted for page transition.
 */
export function shouldInterceptLink(link: HTMLAnchorElement | null): boolean {
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
export function startProgress(): void {
    const bar = document.getElementById('page-transition-progress');
    if (!bar) return;
    // Reset
    bar.classList.remove('done');
    bar.style.display = '';
    // Force reflow so the reset takes effect before adding 'active'
    void (bar as HTMLElement).offsetWidth;
    bar.classList.add('active');
}

/**
 * Complete the progress bar animation and hide it.
 */
export function completeProgress(): void {
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
export function dimPageContent(): void {
    const content = document.getElementById('page-content');
    if (content) {
        content.classList.add('transitioning');
    }
}

/**
 * Restore the page content opacity.
 */
export function restorePageContent(): void {
    const content = document.getElementById('page-content');
    if (content) {
        content.classList.remove('transitioning');
    }
}

/**
 * Close the offcanvas sidebar if it's open (mobile navigation).
 */
export function closeOffcanvas(): void {
    try {
        const offcanvasEl = document.getElementById('navbar-offcanvas');
        if (offcanvasEl) {
            const instance = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
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
 * @param htmlString - The full HTML content of a fetched page.
 * @returns An object containing the page title and the inner HTML of #page-content.
 */
export function extractPageContent(htmlString: string): { title: string; contentHTML: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const titleEl = doc.querySelector('title');
    const newTitle = titleEl ? titleEl.textContent : document.title;

    const pageContent = doc.getElementById('page-content');
    if (!pageContent) {
        throw new Error('Target page has no #page-content element');
    }

    return {
        title: newTitle || '',
        contentHTML: pageContent.innerHTML
    };
}

/**
 * Core navigation function.
 * @param url - The target URL
 * @param pushState - Whether to push a new history entry
 */
export async function navigateTo(url: string, pushState = true): Promise<void> {
    // Preserve language query parameter across internal navigations
    const currentParams = new URLSearchParams(window.location.search);
    const currentLangParam = currentParams.get('lang');
    if (currentLangParam) {
        try {
            const urlObj = new URL(url, window.location.origin);
            urlObj.searchParams.set('lang', currentLangParam);
            url = urlObj.toString();
        } catch { /* ignore invalid URLs */ }
    }

    // Prevent concurrent transitions
    if (isTransitioning) {
        console.warn('Page transition already in progress, ignoring navigation to:', url);
        return;
    }

    // Resolve the full URL to get the pathname for comparison
    let resolvedPath: string;
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
        await initPageContent();

        // 8. Scroll to top or hash target
        if (window.location.hash) {
            scrollToHashTarget(window.location.hash, true);
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
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
 * @param e - The click event object.
 */
export function handleInternalLinkClick(e: MouseEvent): void {
    // Skip if user is holding modifier keys (open in new tab/window)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    // Skip if it's not a left-click
    if (e.button !== 0) return;

    const link = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    if (!link) return;

    if (!shouldInterceptLink(link)) return;

    e.preventDefault();
    navigateTo(link.href);
}

/**
 * Initialize the click listener for internal link navigation.
 */
export function initPageTransitionLinkClicks(): void {
    document.addEventListener('click', handleInternalLinkClick);
}

/**
 * Handle browser back/forward navigation.
 * @param e - The popstate event object.
 */
export function handlePopState(_e: PopStateEvent): void {
    const currentPath = normalizeInternalPath(window.location.pathname);
    if ((INTERNAL_PAGES as readonly string[]).includes(currentPath)) {
        navigateTo(window.location.href, false);
    }
    // If the popped state is not an internal page, let the browser handle it normally
}

/**
 * Initialize the popstate listener for browser back/forward navigation.
 */
export function initPageTransitionPopState(): void {
    window.addEventListener('popstate', handlePopState);
}
