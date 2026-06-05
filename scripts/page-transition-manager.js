/**
 * Page Transition Manager
 *
 * Intercepts internal navigation links to provide a smooth page transition
 * with a progress bar, keeping the current page content visible until the
 * new page is fully initialized.
 */

(function () {
    'use strict';

    // ── Configuration ─────────────────────────────────────────────────────────────
    const PROGRESS_BAR_ID = 'page-transition-progress';
    const PROGRESS_BAR_CLASS = 'page-transition-progress-bar';
    const PAGE_CONTENT_ID = 'page-content';
    const CONTENT_SELECTOR = '#page-content';
    const PAGE_INITIALIZED_EVENT = 'pageInitialized';
    const TRANSITION_DISABLE_ATTR = 'data-no-transition';

    // Progress bar simulation steps
    const PROGRESS_STEPS = [
        { pct: 15, delay: 100 },
        { pct: 30, delay: 200 },
        { pct: 50, delay: 400 },
        { pct: 65, delay: 700 },
        { pct: 78, delay: 1200 },
        { pct: 88, delay: 2000 },
        { pct: 95, delay: 3000 },
    ];

    // ── State ─────────────────────────────────────────────────────────────────────
    let isTransitioning = false;
    let progressBarEl = null;
    let progressBarInner = null;
    let progressTimeouts = [];
    let abortController = null;
    let isFirstLoad = true; // Track first load vs subsequent navigation

    // ── Progress Bar ──────────────────────────────────────────────────────────────

    function ensureProgressBar() {
        if (progressBarEl && document.body.contains(progressBarEl)) {
            return;
        }

        // Create progress bar container
        progressBarEl = document.createElement('div');
        progressBarEl.id = PROGRESS_BAR_ID;
        progressBarEl.className = 'd-none';

        progressBarInner = document.createElement('div');
        progressBarInner.className = PROGRESS_BAR_CLASS;
        progressBarInner.setAttribute('role', 'progressbar');
        progressBarInner.setAttribute('aria-label', 'Page loading');

        progressBarEl.appendChild(progressBarInner);
        document.body.prepend(progressBarEl);
    }

    function showProgressBar() {
        ensureProgressBar();
        progressBarEl.classList.remove('d-none');
        setProgress(3);
    }

    function setProgress(pct) {
        if (progressBarInner) {
            progressBarInner.style.width = pct + '%';
        }
    }

    function simulateProgress() {
        clearProgressTimeouts();
        PROGRESS_STEPS.forEach(step => {
            const timeoutId = setTimeout(() => {
                if (isTransitioning) {
                    setProgress(step.pct);
                }
            }, step.delay);
            progressTimeouts.push(timeoutId);
        });
    }

    function clearProgressTimeouts() {
        progressTimeouts.forEach(id => clearTimeout(id));
        progressTimeouts = [];
    }

    function completeProgressBar() {
        clearProgressTimeouts();
        setProgress(100);

        // Briefly show completion, then hide
        setTimeout(() => {
            if (progressBarEl) {
                progressBarEl.classList.add('d-none');
            }
            setProgress(0);
        }, 300);
    }

    function hideProgressBarImmediately() {
        clearProgressTimeouts();
        if (progressBarEl) {
            progressBarEl.classList.add('d-none');
        }
        setProgress(0);
    }

    // ── Content Extraction ────────────────────────────────────────────────────────

    function extractPageContent(html, url) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract title
        const title = doc.querySelector('title');
        const pageTitle = title ? title.textContent.trim() : '';

        // Extract page content
        const newContent = doc.querySelector(CONTENT_SELECTOR);
        const contentHtml = newContent ? newContent.innerHTML : '';

        // Extract page-specific inline scripts (scripts inside #page-content)
        const inlineScripts = [];
        if (newContent) {
            const scriptTags = newContent.querySelectorAll('script:not([src])');
            scriptTags.forEach(script => {
                inlineScripts.push(script.textContent);
            });
        }

        // Extract the list of data-component ids from the target page
        const componentIds = [];
        doc.querySelectorAll('[data-component]').forEach(el => {
            if (el.id) componentIds.push(el.id);
        });

        // Extract body classes
        const bodyEl = doc.querySelector('body');
        const bodyClasses = bodyEl ? bodyEl.getAttribute('class') || '' : '';

        // Extract page-content classes (e.g., 404 has container/centering classes)
        const pageContentEl = doc.querySelector(CONTENT_SELECTOR);
        const pageContentClasses = pageContentEl ? pageContentEl.getAttribute('class') || '' : '';

        return {
            title: pageTitle,
            contentHtml: contentHtml,
            inlineScripts: inlineScripts,
            componentIds: componentIds,
            bodyClasses: bodyClasses,
            pageContentClasses: pageContentClasses,
            doc: doc
        };
    }

    // ── Navigation ────────────────────────────────────────────────────────────────

    function shouldInterceptLink(linkEl) {
        if (!linkEl || !linkEl.href) return false;

        // Skip if explicitly disabled
        if (linkEl.hasAttribute(TRANSITION_DISABLE_ATTR)) return false;
        if (linkEl.closest('[' + TRANSITION_DISABLE_ATTR + ']')) return false;

        // Skip external links (different origin)
        if (linkEl.origin !== window.location.origin) return false;

        // Skip special protocols
        const href = linkEl.getAttribute('href') || '';
        if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (href.startsWith('#')) return false; // Same-page anchor

        // Skip download links
        if (linkEl.hasAttribute('download')) return false;

        // Skip target="_blank"
        if (linkEl.getAttribute('target') === '_blank') return false;

        // Skip interactive elements that are handled elsewhere
        if (linkEl.hasAttribute('data-lang')) return false;     // Language switcher
        if (linkEl.hasAttribute('data-theme')) return false;    // Theme switcher
        if (linkEl.hasAttribute('data-settings-open')) return false; // Settings
        if (linkEl.closest('.theme-item')) return false;
        if (linkEl.closest('[data-lang]')) return false;

        // Skip links that are just anchors on the current page
        const url = new URL(linkEl.href);
        if (url.pathname === window.location.pathname && url.hash) return false;

        return true;
    }

    async function navigateTo(url, options = {}) {
        // Immediately return if navigating to the current page with only a hash change
        if (typeof url === 'string') {
            const targetUrl = new URL(url, window.location.origin);
            if (targetUrl.pathname === window.location.pathname && targetUrl.hash) {
                if (typeof scrollToHashTarget === 'function') {
                    scrollToHashTarget(targetUrl.hash, true);
                }
                return;
            }
        }

        if (isTransitioning) {
            // If already transitioning, abort previous and navigate to latest
            if (abortController) {
                abortController.abort();
            }
        }

        isTransitioning = true;
        if (abortController) {
            abortController = null;
        }

        const targetUrl = typeof url === 'string' ? url : url.href;
        const pathname = typeof url === 'string' ? new URL(url, window.location.origin).pathname : url.pathname;

        // Show progress bar (old page content remains visible)
        showProgressBar();
        simulateProgress();

        // Add a subtle fade effect to indicate loading
        const pageContent = document.getElementById(PAGE_CONTENT_ID);
        if (pageContent) {
            pageContent.classList.add('page-transition-fade');
        }

        try {
            // Fetch the new page HTML
            const response = await fetch(targetUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();
            const extracted = extractPageContent(html, targetUrl);

            // Update document title
            if (extracted.title) {
                document.title = extracted.title;
            }

            // Replace page content
            if (pageContent && extracted.contentHtml) {
                // Set the page-content classes to match the target page
                pageContent.className = extracted.pageContentClasses || '';
                pageContent.innerHTML = extracted.contentHtml;
            }

            // Update body classes to match target page (e.g., add/remove min-vh-100)
            if (extracted.bodyClasses !== undefined) {
                document.body.className = extracted.bodyClasses;
            }

            // Force a reflow to ensure flex layout recalculates correctly
            // This prevents footer positioning issues after content replacement
            void document.body.offsetHeight;

            // ── Sync data-component elements ─────────────────────────────────
            // Collect current component ids
            const currentComponentIds = [];
            document.querySelectorAll('[data-component]').forEach(el => {
                if (el.id) currentComponentIds.push(el.id);
            });

            // Determine order: where to insert new components
            // We insert them right after #page-content to maintain visual order
            const pageContentEl = document.getElementById(PAGE_CONTENT_ID);
            const insertAfterEl = pageContentEl;

            // Remove components that the target page doesn't have
            for (const id of currentComponentIds) {
                if (!extracted.componentIds.includes(id)) {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                }
            }

            // Load or refresh components that the target page has
            for (const id of extracted.componentIds) {
                const existingEl = document.getElementById(id);
                if (!existingEl) {
                    // New component: create container and load
                    const div = document.createElement('div');
                    div.id = id;
                    div.setAttribute('data-component', '');
                    if (insertAfterEl && insertAfterEl.nextSibling) {
                        document.body.insertBefore(div, insertAfterEl.nextSibling);
                    } else {
                        document.body.appendChild(div);
                    }
                    await loadHTML(id, '/sub-pages/' + id + '.html');
                }
                // If component already exists, skip reloading to avoid unnecessary DOM churn
            }

            // Re-initialize settings modal if the settings-modal component exists
            if (extracted.componentIds.includes('settings-modal')) {
                if (typeof initializeSettingsModal === 'function') {
                    initializeSettingsModal();
                }
                if (typeof populateLanguageMenus === 'function') {
                    populateLanguageMenus();
                }
            }

            // Re-initialize dropdown animation if the header component exists
            if (extracted.componentIds.includes('header')) {
                if (typeof initializeDropdownMenuAnimation === 'function') {
                    initializeDropdownMenuAnimation();
                }
            }

            // Force reflow to stabilize layout after component changes
            void document.body.offsetHeight;

            // Execute any inline scripts found in the new page content
            extracted.inlineScripts.forEach(scriptContent => {
                try {
                    const scriptEl = document.createElement('script');
                    scriptEl.textContent = scriptContent;
                    document.body.appendChild(scriptEl);
                    document.body.removeChild(scriptEl);
                } catch (e) {
                    console.warn('Failed to execute inline script:', e);
                }
            });

            // Re-apply theme images after content changes
            if (typeof applyThemeBasedImages === 'function') {
                applyThemeBasedImages();
            }

            // Update browser history BEFORE initialization tasks,
            // so functions like generateLinkCards can read the correct pathname
            if (!options.replaceState) {
                window.history.pushState({ path: pathname }, '', pathname);
            } else {
                window.history.replaceState({ path: pathname }, '', pathname);
            }

            // Re-run initialization tasks (handles link cards, i18n, theme, etc.)
            await runPostNavigationTasks(targetUrl);

            // After the first page load, initialization.js dispatches pageInitialized.
            // On subsequent navigations, we handle initialization ourselves above,
            // so we use a brief minimum delay to ensure the DOM settles.
            if (isFirstLoad) {
                await waitForPageInitialized();
                isFirstLoad = false;
            } else {
                // Minimum delay for the DOM to render before completing
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Navigation complete
            completeProgressBar();

            // Remove fade
            if (pageContent) {
                pageContent.classList.remove('page-transition-fade');
            }

            // Handle hash scroll
            const hash = window.location.hash;
            if (hash && typeof scrollToHashTarget === 'function') {
                // Small delay to ensure DOM is ready
                setTimeout(() => scrollToHashTarget(hash, true), 50);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                // Navigation was aborted by a newer navigation
                return;
            }

            console.error('Page transition failed:', error);

            // If fetch fails, do a normal hard navigation as fallback
            hideProgressBarImmediately();
            if (pageContent) {
                pageContent.classList.remove('page-transition-fade');
            }
            window.location.href = targetUrl;
        } finally {
            isTransitioning = false;
        }
    }

    function waitForPageInitialized() {
        return new Promise((resolve) => {
            // Use a timeout as safety net
            const timeout = setTimeout(() => {
                resolve();
            }, 5000); // 5 second max wait

            function onInitialized() {
                clearTimeout(timeout);
                document.removeEventListener(PAGE_INITIALIZED_EVENT, onInitialized);
                resolve();
            }

            document.addEventListener(PAGE_INITIALIZED_EVENT, onInitialized);
        });
    }

    // ── Post-Navigation Tasks ────────────────────────────────────────────────────

    async function runPostNavigationTasks(url) {
        const tasks = [];

        // Re-apply theme-based images
        if (typeof applyThemeBasedImages === 'function') {
            tasks.push(applyThemeBasedImages());
        }

        // Re-activate tooltips
        if (typeof activateTooltips === 'function') {
            tasks.push(activateTooltips());
        }

        // Re-bind title link anchors
        if (typeof addEventListenerToTitleLinkAnchors === 'function') {
            tasks.push(addEventListenerToTitleLinkAnchors());
        }

        // Re-apply external link target behavior
        if (typeof applyExternalLinkTargetBehavior === 'function') {
            tasks.push(applyExternalLinkTargetBehavior());
        }

        // Run link-cards-generator if the links container exists
        if (document.getElementById('links') && typeof generateLinkCards === 'function') {
            // generateLinkCards calls loadLang internally which updates page text,
            // sets active nav, active lang, theme text, etc.
            tasks.push(generateLinkCards());
        } else {
            // For pages without link cards, run individual updates
            if (typeof updatePageText === 'function') {
                tasks.push(updatePageText());
            }
            if (typeof updateThemeToggleText === 'function') {
                tasks.push(updateThemeToggleText());
            }
            if (typeof setActiveThemeItem === 'function') {
                tasks.push(setActiveThemeItem());
            }
            if (typeof populateLanguageMenus === 'function') {
                tasks.push(populateLanguageMenus());
            }
            if (typeof setActiveLangItem === 'function') {
                tasks.push(setActiveLangItem());
            }
        }

        await Promise.all(tasks);

        // Update navbar active state
        if (typeof setActiveNavItem === 'function') {
            setActiveNavItem();
        }
    }

    // ── Event Handlers ────────────────────────────────────────────────────────────

    function handleLinkClick(e) {
        const link = e.target.closest('a');
        if (!link) return;

        // Let middle-click, ctrl+click, etc. pass through
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // Never intercept same-page anchor links (href="#...")
        const rawHref = link.getAttribute('href');
        if (rawHref && rawHref.startsWith('#')) return;

        if (!shouldInterceptLink(link)) return;

        e.preventDefault();

        // If the target is the current page with a hash fragment,
        // handle it as a same-page anchor scroll instead of full navigation
        const targetUrl = new URL(link.href);
        const currentPath = window.location.pathname;
        if (targetUrl.pathname === currentPath && targetUrl.hash) {
            if (typeof scrollToHashTarget === 'function') {
                window.history.pushState(null, '', targetUrl.hash);
                scrollToHashTarget(targetUrl.hash);
            }
            return;
        }

        navigateTo(link.href);
    }

    function handlePopState(e) {
        const path = window.location.pathname;
        // Use replaceState to avoid stacking history entries
        navigateTo(path, { replaceState: true });
    }

    // ── Public API ────────────────────────────────────────────────────────────────

    // Expose for external use (e.g., for programmatic navigation)
    window.PageTransition = {
        navigateTo: function (url) {
            navigateTo(url);
        },
        isTransitioning: function () {
            return isTransitioning;
        }
    };

    // ── Initialization ────────────────────────────────────────────────────────────

    function init() {
        // Ensure we have the progress bar element
        ensureProgressBar();

        // Intercept all click events on the document for navigation links
        document.addEventListener('click', handleLinkClick);

        // Handle browser back/forward
        window.addEventListener('popstate', handlePopState);

        console.log('[PageTransition] Manager initialized.');
    }

    // Initialize after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
