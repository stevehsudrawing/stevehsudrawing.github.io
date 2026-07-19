/**
 * Navbar and dropdown behaviors.
 * Provides active nav-item highlighting, dropdown menu animations,
 * and mobile navbar-brand scroll swapping (logo → page name).
 */

/**
 * Highlight the navbar link that matches the current page path.
 */
function setActiveNavItem() {
    try {
        const currentPage = normalizeInternalPath(window.location.pathname);

        const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
        if (navLinks.length === 0) {
            console.warn('Cannot find navbar links!');
            return;
        }

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            } else {
                link.classList.remove('active');
                link.removeAttribute('aria-current');
            }
        });
    } catch (error) {
        console.error('Failed to activate nav item: ', error);
    }
}

/**
 * Wire up show/hide animation hooks on all Bootstrap dropdown menus
 * so they fade in/out smoothly instead of appearing instantly.
 */
function initDropdownMenuAnimation() {
    document.querySelectorAll('.dropdown').forEach(dropdown => {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (!menu) {
            return;
        }

        dropdown.addEventListener('show.bs.dropdown', () => {
            menu.style.display = 'block';
            menu.classList.remove('closing');
            menu.classList.add('animating');
        });

        dropdown.addEventListener('shown.bs.dropdown', () => {
            menu.classList.remove('animating');
        });

        dropdown.addEventListener('hide.bs.dropdown', event => {
            if (menu.classList.contains('closing')) {
                return;
            }

            event.preventDefault();
            menu.style.display = 'block';
            menu.classList.add('closing');
            menu.classList.remove('show');

            const toggle = dropdown.querySelector('[data-bs-toggle="dropdown"]');
            const cleanup = () => {
                menu.classList.remove('closing');
                menu.style.display = '';
                dropdown.classList.remove('show');
                if (toggle) {
                    toggle.classList.remove('show');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            };

            menu.addEventListener('transitionend', function handler(evt) {
                if (evt.target === menu && evt.propertyName === 'opacity') {
                    cleanup();
                    menu.removeEventListener('transitionend', handler);
                }
            }, { once: true });

            setTimeout(cleanup, 250);
        });
    });
}

/**
 * On mobile (< 992px), smoothly slide the navbar-brand logo and current
 * page name vertically based on scroll position (0 px – 64 px).
 *
 * - Logo slides up and out of view as the user scrolls down.
 * - Page name slides up from below into view.
 * - Beyond 64 px both elements stay at their final positions.
 * - Clicking the page name scrolls smoothly back to top.
 *
 * When JS is disabled the page-name slide stays hidden (CSS default)
 * so only the logo is visible.
 */
function initMobileNavbarBrandScroll() {
    const container = document.getElementById('navbar-brand-container');
    const logoTarget = document.getElementById('navbar-brand-logo-slide');
    const pageTarget = document.getElementById('navbar-brand-page-slide');
    const brandText = pageTarget ? pageTarget.querySelector('.navbar-brand-text') : null;
    if (!container || !logoTarget || !pageTarget || !brandText) return;

    const pageNameLink = pageTarget.querySelector('a');

    /**
     * Derive the i18n key from the current page filename.
     * e.g. /about.html  -> text-about
     *      /index.html  -> text-index
     */
    function getPageI18nKey() {
        const pageName = extractPageName(window.location.pathname);
        return 'text-' + pageName;
    }

    /**
     * Update slide transforms based on current scroll position and viewport width.
     */
    function updateSlides() {
        const isMobile = window.innerWidth < 992;

        if (isMobile) {
            // Ensure the page-name slide is visible (hidden by default CSS)
            pageTarget.style.display = 'flex';

            // Clamp progress to [0, 1] over the 0–64 px scroll range
            const progress = Math.min(Math.max(window.scrollY / 64, 0), 1);

            // Logo: 0 → -100 % (slides up out of view)
            logoTarget.style.transform = 'translateY(-' + (progress * 100) + '%)';
            // Page name: 100 % → 0 (slides up into view from below)
            pageTarget.style.transform = 'translateY(' + ((1 - progress) * 100) + '%)';
        } else {
            // Desktop: reset inline overrides so CSS defaults take over
            logoTarget.style.transform = '';
            pageTarget.style.transform = '';
            pageTarget.style.display = '';
        }
    }

    // Populate the page-name text via i18n
    updateNavbarBrandText();

    // Click handler: scroll smoothly to top when the page-name link is tapped
    if (pageNameLink) {
        pageNameLink.addEventListener('click', function (e) {
            if (window.innerWidth < 992) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                updateSlides();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', updateSlides);
    updateSlides();
}

/**
 * Update the navbar-brand page-name text to reflect the current page.
 * Safe to call multiple times (e.g. after SPA page transitions).
 */
function updateNavbarBrandText() {
    const brandText = document.querySelector('#navbar-brand-page-slide .navbar-brand-text');
    if (!brandText) return;

    const pageName = extractPageName(window.location.pathname);
    const i18nKey = 'text-' + pageName;
    brandText.setAttribute('data-i18n', i18nKey);
    const translated = translate(i18nKey);
    if (translated) {
        brandText.textContent = translated;
    }
}

/**
 * Add a subtle bottom border to the navbar when the page is scrolled
 * past the very top. Works at all viewport sizes.
 */
function initNavbarScrollBorder() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                if (window.scrollY > 0) {
                    navbar.classList.add('navbar-scrolled');
                } else {
                    navbar.classList.remove('navbar-scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}
