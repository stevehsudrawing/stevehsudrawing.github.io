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
 * On mobile (< 992px), when the page is scrolled past 64px,
 * replace the navbar-brand SVG logo with the current page name.
 * Clicking the brand then scrolls to top instead of navigating to /index.html.
 */
function initMobileNavbarBrandScroll() {
    const navbar = document.querySelector('.navbar');
    const navbarBrand = document.querySelector('.navbar-brand');
    if (!navbar || !navbarBrand) return;

    const brandSvg = navbarBrand.querySelector('svg');
    const brandText = navbarBrand.querySelector('.navbar-brand-text');
    if (!brandSvg || !brandText) return;

    const originalHref = navbarBrand.getAttribute('href') || '/index.html';

    /**
     * Derive the i18n key from the current page filename.
     * e.g. /about.html  -> text-about
     *      /index.html  -> text-index
     */
    function getPageI18nKey() {
        const pageName = extractPageName(window.location.pathname);
        return 'text-' + pageName;
    }

    function updateBrand() {
        const isMobile = window.innerWidth < 992;
        const scrolledPast = window.scrollY > 64;

        if (isMobile && scrolledPast) {
            const i18nKey = getPageI18nKey();
            brandText.setAttribute('data-i18n', i18nKey);
            const translated = translate(i18nKey);
            if (translated) {
                brandText.textContent = translated;
            }

            navbar.classList.add('scrolled-past');
            navbarBrand.setAttribute('href', '#');
        } else {
            navbar.classList.remove('scrolled-past');
            navbarBrand.setAttribute('href', originalHref);
        }
    }

    // Click handler: when scrolled past, scroll smoothly to top
    navbarBrand.addEventListener('click', function (e) {
        if (navbar.classList.contains('scrolled-past')) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                updateBrand();
                ticking = false;
            });
            ticking = true;
        }
    });

    window.addEventListener('resize', updateBrand);
    updateBrand();
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
