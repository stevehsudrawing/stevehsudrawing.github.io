// Activate Nav Item
function setActiveNavItem() {
    try {
        const currentPath = window.location.pathname;
        let currentPage = currentPath === '/' ? '/' : currentPath;
        if (currentPage === '/') currentPage = '/index.html';

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

function initializeDropdownMenuAnimation() {
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

function activateTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

function disposeAllTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const instance = bootstrap.Tooltip.getInstance(el);
        if (instance) {
            instance.dispose();
        }
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
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
        const pageName = filename.replace(/\.html$/, '') || 'index';
        return 'text-' + pageName;
    }

    function updateBrand() {
        const isMobile = window.innerWidth < 992;
        const scrolledPast = window.scrollY > 64;

        if (isMobile && scrolledPast) {
            const i18nKey = getPageI18nKey();
            brandText.setAttribute('data-i18n', i18nKey);
            if (typeof langData !== 'undefined' && langData[i18nKey]) {
                brandText.textContent = langData[i18nKey];
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

let scrollHintResizeSetup = false;

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
 * When a .link-button-group overflows its container,
 * show a "Scroll Horizontally" hint below it so users know they can swipe.
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
