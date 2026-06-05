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