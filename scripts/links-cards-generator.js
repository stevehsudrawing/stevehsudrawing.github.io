function resolveLinksJsonPath() {
    const container = document.getElementById('links');
    if (container && container.dataset.linksJson) {
        return container.dataset.linksJson;
    }

    const pathname = window.location.pathname;
    const pageName = pathname.split('/').pop() || 'index.html';
    const baseName = pageName.replace(/\.[^.]+$/, '') || 'index';
    return `/links/${baseName}.json`;
}

function setElementAttributes(element, properties = {}) {
    Object.entries(properties).forEach(([key, value]) => {
        if (key === 'class') {
            if (Array.isArray(value)) {
                value.forEach(cls => element.classList.add(cls));
            } else if (typeof value === 'string') {
                value.split(' ').filter(Boolean).forEach(cls => element.classList.add(cls));
            }
            return;
        }

        if (value === false || value === null || value === undefined) {
            return;
        }

        element.setAttribute(key, String(value));
    });
}

function createTextSpan(text) {
    const span = document.createElement('span');
    if (!text) return span;

    const { content = '', properties } = text;
    setElementAttributes(span, properties);
    span.textContent = content;
    return span;
}

function escapeForOnclick(value) {
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

function createSuperLinkFragment(fragment) {
    const link = document.createElement('a');
    const href = fragment?.properties?.href || '';
    if (fragment?.properties) {
        setElementAttributes(link, fragment.properties);
    }

    const titleSpan = createTextSpan(fragment.text);
    link.appendChild(titleSpan);

    const wrapperIcon = document.createElement('i');
    wrapperIcon.className = 'bi bi-box-arrow-up-right align-top bi-additional';
    link.appendChild(document.createTextNode(' '));
    link.appendChild(wrapperIcon);

    const extraNodes = [link];

    if (href) {
        const qrButton = document.createElement('a');
        qrButton.setAttribute('href', 'javascript:void(0)');
        qrButton.setAttribute('role', 'button');
        qrButton.setAttribute('onclick', `showQRCodeModal('${escapeForOnclick(href)}')`);
        qrButton.className = 'ms-2 text-decoration-none';
        qrButton.setAttribute('aria-label', 'Show QR Code');
        qrButton.setAttribute('data-bs-toggle', 'tooltip');
        qrButton.setAttribute('data-bs-title', 'Show QR Code');

        const qrIcon = document.createElement('i');
        qrIcon.className = 'bi bi-qr-code';
        qrButton.appendChild(qrIcon);

        extraNodes.push(qrButton);
    }

    return extraNodes;
}

function createFragmentElements(fragment) {
    if (!fragment) return [];
    if (fragment.superLink === true) {
        return createSuperLinkFragment(fragment);
    }

    return [createTextSpan(fragment.text)];
}

function appendFragments(container, fragments) {
    if (!Array.isArray(fragments)) return;

    fragments.forEach((fragment, index) => {
        const fragmentElements = createFragmentElements(fragment);
        fragmentElements.forEach((fragmentElement, i) => {
            container.appendChild(fragmentElement);
            if (i === 0 && fragmentElements.length > 1) {
                // separate the link and its QR button for inline layout
                container.appendChild(document.createTextNode(' '));
            }
        });

        if (index < fragments.length - 1) {
            const hasTrailingSpace = typeof fragment?.text?.content === 'string' && fragment.text.content.endsWith(' ');
            if (!hasTrailingSpace) {
                container.appendChild(document.createTextNode(' '));
            }
        }
    });
}

function buildTitleElement(titleFragments) {
    const titleElement = document.createElement('h6');
    titleElement.className = 'card-title';

    const hasSingleSuperLink = Array.isArray(titleFragments) && titleFragments.filter(fragment => fragment?.superLink === true).length === 1 && titleFragments.length === 1;
    if (hasSingleSuperLink) {
        titleElement.classList.add('d-flex', 'align-items-center', 'justify-content-between');
    }

    appendFragments(titleElement, titleFragments);
    return titleElement;
}

function buildDescriptionElement(descriptionFragments) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'card-text';
    appendFragments(descriptionElement, descriptionFragments);
    return descriptionElement;
}

function buildIconElement(iconData) {
    if (!iconData || typeof iconData !== 'object') return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'container-img-link-icon';

    const image = document.createElement('img');
    if (iconData.properties) {
        setElementAttributes(image, iconData.properties);
    }

    image.classList.add('img-fluid', 'img-fit');
    if (!image.hasAttribute('class')) {
        image.setAttribute('class', 'img-fluid img-fit');
    }

    wrapper.appendChild(image);
    return wrapper;
}

function buildCardItem(cardData) {
    const column = document.createElement('div');
    column.className = 'col-lg-6 col-xxl-4';

    if (cardData.available !== true) {
        column.classList.add('opacity-75');
    }

    const card = document.createElement('div');
    card.className = 'card';

    const cardBody = document.createElement('div');
    cardBody.className = 'd-flex card-body';

    if (cardData.icon) {
        const iconElement = buildIconElement(cardData.icon);
        if (iconElement) {
            cardBody.appendChild(iconElement);
        }
    }

    if (cardData.title || cardData.description) {
        const textContainer = document.createElement('div');
        textContainer.className = 'flex-grow-1';

        if (cardData.title) {
            const titleElement = buildTitleElement(cardData.title);
            textContainer.appendChild(titleElement);
        }

        if (cardData.description) {
            const descriptionElement = buildDescriptionElement(cardData.description);
            textContainer.appendChild(descriptionElement);
        }

        cardBody.appendChild(textContainer);
    }

    card.appendChild(cardBody);
    column.appendChild(card);
    return column;
}

function buildLinkGroup(groupData) {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'link-hub-part';

    if (groupData.title) {
        const title = document.createElement('h4');
        title.textContent = groupData.title.content || '';
        title.classList.add('title-link-group')
        setElementAttributes(title, groupData.title.properties);
        groupWrapper.appendChild(title);
    }

    if (Array.isArray(groupData.contents)) {
        const row = document.createElement('div');
        row.className = 'row g-2';

        groupData.contents.forEach(cardData => {
            const cardItem = buildCardItem(cardData);
            row.appendChild(cardItem);
        });

        groupWrapper.appendChild(row);
    }

    return groupWrapper;
}

async function generateLinkCards() {
    const container = document.getElementById('links');
    if (!container) {
        console.warn('Could not find element with id "links" to insert card groups.');
        return;
    }

    try {
        const linksJsonPath = resolveLinksJsonPath();
        const response = await fetch(linksJsonPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${linksJsonPath}: ${response.status}`);
        }

        const groups = await response.json();
        if (!Array.isArray(groups)) {
            throw new Error(`JSON data is not an array: ${linksJsonPath}`);
        }

        container.innerHTML = '';

        groups.forEach((groupData, index) => {
            const groupElement = buildLinkGroup(groupData);
            container.appendChild(groupElement);
            if (index < groups.length - 1) {
                container.appendChild(document.createElement('hr'));
            }
        });

        // Load language file
        const savedLang = localStorage.getItem('preferredLang') || 'en';
        loadLang(savedLang);
    } catch (error) {
        console.error('Failed to generate link cards:', error);
        container.innerHTML = '<div class="alert alert-warning">Unable to load link cards.</div>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    generateLinkCards();
});
