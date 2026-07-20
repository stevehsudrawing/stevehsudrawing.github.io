/**
 * Link-cards generator.
 * Reads a JSON configuration file, builds a set of responsive card groups
 * with icons, titles, descriptions, and super-link fragments (links with
 * QR-code buttons), then injects them into the #links container.
 */

/**
 * Determine which JSON file to load based on the current page or a
 * data-links-json attribute on the #links container.
 * @returns {string} The resolved JSON path (e.g. '/configs/links/about.json').
 */
function resolveLinksJsonPath() {
    const container = document.getElementById('links');
    if (container && container.dataset.linksJson) {
        return container.dataset.linksJson;
    }

    const baseName = extractPageName(window.location.pathname);
    return `/configs/links/${baseName}.json`;
}

/**
 * Create a <span> element from a text descriptor object.
 * @param {Object} text - Descriptor with `content`, optional `properties`, and `isHtml`.
 * @param {string} text.content - The text (or HTML when isHtml is true).
 * @param {Object} [text.properties] - Attributes to set on the span.
 * @param {boolean} [text.isHtml] - When true, use innerHTML instead of textContent.
 * @returns {HTMLSpanElement} The created span element.
 */
function createTextSpan(text) {
    const span = document.createElement('span');
    if (!text) return span;

    const { content = '', properties, isHtml } = text;
    setElementAttributes(span, properties);
    if (isHtml) {
        span.innerHTML = content;
    } else {
        span.textContent = content;
    }
    return span;
}

/**
 * Escape a string for safe embedding inside an onclick handler attribute.
 * @param {*} value - The value to escape.
 * @returns {string} Escaped string safe for single-quoted JS attributes.
 */
function escapeForOnclick(value) {
    return String(value).replace(/'/g, "\\'").replace(/\\/g, '\\\\');
}

/**
 * Build a "super link" fragment: an link plus an adjacent QR-code button that
 * opens the QR modal for the link URL.
 * @param {Object} fragment - Fragment descriptor with properties and text array.
 * @returns {HTMLElement[]} Array of created elements (link + optional QR button).
 */
function createSuperLinkFragment(fragment) {
    const link = document.createElement('a');
    const href = fragment?.properties?.href || '';
    if (fragment?.properties) {
        setElementAttributes(link, fragment.properties);
    }

    link.classList.add('link');

    if (Array.isArray(fragment.text)) {
        fragment.text.forEach(textItem => {
            const titleSpan = createTextSpan(textItem);
            link.appendChild(titleSpan);
        });
    }

    const extraNodes = [link];

    if (href) {
        const qrButton = document.createElement('a');
        qrButton.setAttribute('href', 'javascript:void(0)');
        qrButton.setAttribute('role', 'button');

        const iconPropsJson = fragment.iconProperties
            ? JSON.stringify(fragment.iconProperties)
            : null;
        const onclickArgs = iconPropsJson
            ? `'${escapeForOnclick(href)}', ${iconPropsJson}`
            : `'${escapeForOnclick(href)}'`;
        qrButton.setAttribute('onclick', `showQRCodeModal(${onclickArgs})`);
        qrButton.className = 'text-decoration-none';
        qrButton.setAttribute('aria-label', 'Show QR Code');
        qrButton.setAttribute('data-bs-toggle', 'tooltip');
        qrButton.setAttribute('data-i18n-tooltip', 'text-show-qr-code');
        qrButton.setAttribute('data-bs-title', 'Show QR Code');

        const qrIcon = document.createElement('i');
        qrIcon.className = 'bi bi-qr-code';
        qrButton.appendChild(qrIcon);

        extraNodes.push(qrButton);
    }

    return extraNodes;
}

/**
 * Dispatch a fragment descriptor to the appropriate element builder.
 * @param {Object} fragment - Fragment descriptor.
 * @returns {HTMLElement[]} Array of created elements.
 */
function createFragmentElements(fragment) {
    if (!fragment) return [];
    if (fragment.superLink === true) {
        return createSuperLinkFragment(fragment);
    }

    if (Array.isArray(fragment.text)) {
        return fragment.text.map(textItem => createTextSpan(textItem));
    }
    return [];
}

/**
 * Append an array of fragment descriptors as child elements to a container.
 * Inserts spaces between fragments unless the preceding fragment already
 * ends with a space.
 * @param {HTMLElement} container - The parent element.
 * @param {Object[]} fragments - Array of fragment descriptors.
 */
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
            const lastTextItem = Array.isArray(fragment?.text) ? fragment.text[fragment.text.length - 1] : fragment?.text;
            const hasTrailingSpace = typeof lastTextItem?.content === 'string' && lastTextItem.content.endsWith(' ');
            if (!hasTrailingSpace) {
                container.appendChild(document.createTextNode(' '));
            }
        }
    });
}

/**
 * Build a card-title <h6> element from an array of title fragments.
 * @param {Object[]} titleFragments - Array of fragment descriptors for the title.
 * @returns {HTMLHeadingElement} The created h6 element.
 */
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

/**
 * Build a card-text <p> element from an array of description fragments.
 * @param {Object[]} descriptionFragments - Array of fragment descriptors.
 * @returns {HTMLParagraphElement} The created p element.
 */
function buildDescriptionElement(descriptionFragments) {
    const descriptionElement = document.createElement('p');
    descriptionElement.className = 'card-text';
    appendFragments(descriptionElement, descriptionFragments);
    return descriptionElement;
}

/**
 * Build an icon wrapper element (<div> with an <img>) from icon descriptor data.
 * @param {Object} iconData - Descriptor with optional properties for the <img>.
 * @returns {HTMLDivElement|null} The icon wrapper, or null if iconData is invalid.
 */
function buildIconElement(iconData) {
    if (!iconData || typeof iconData !== 'object') return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'link-icon-wrapper me-2';

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

/**
 * Convert arbitrary text to a URL-safe dash-case slug.
 * Strips special characters, replaces whitespace/underscores with hyphens,
 * and collapses consecutive hyphens.
 * @param {string} text - The input text.
 * @returns {string} The dash-case slug.
 */
function toDashCase(text) {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]+/gu, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Build a single card column from card descriptor data.
 * Produces a <div.col> containing a Bootstrap card with optional icon,
 * title, and description.
 * @param {Object} cardData - Card descriptor from the links JSON.
 * @returns {HTMLDivElement} The column element containing the card.
 */
function buildCardItem(cardData) {
    const column = document.createElement('div');
    column.className = 'card-wrapper col-lg-6 col-xxl-4';

    if (cardData.available !== true) {
        column.classList.add('opacity-75');
    }

    const card = document.createElement('div');
    card.className = 'card flex-grow-1';

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

        // Attach card icon properties to super-link fragments so the QR
        // code modal can display the same icon at its centre.
        const iconProperties = cardData.icon?.properties;
        if (iconProperties) {
            [cardData.title, cardData.description].forEach(fragments => {
                if (Array.isArray(fragments)) {
                    fragments.forEach(fragment => {
                        if (fragment?.superLink) {
                            fragment.iconProperties = iconProperties;
                        }
                    });
                }
            });
        }

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

/**
 * Build an entire link group section from group descriptor data.
 * Includes an optional title (with anchor), description, and a row of cards.
 * @param {Object} groupData - Group descriptor from the links JSON.
 * @returns {HTMLDivElement} The group wrapper element.
 */
function buildLinkGroup(groupData) {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'link-hub-part';

    if (Array.isArray(groupData.title) && groupData.title.length > 0) {
        // Derive plain-text title from all span descriptors for the anchor id.
        const titleText = groupData.title
            .map(spanDesc => spanDesc?.content || '')
            .join('');
        const titleId = toDashCase(titleText);

        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-link-group-wrapper';

        const title = document.createElement('h4');
        title.classList.add('title-link-group');
        if (titleId) {
            title.id = titleId;
        }

        groupData.title.forEach(spanDesc => {
            const span = createTextSpan(spanDesc);
            title.appendChild(span);
        });

        titleContainer.appendChild(title);

        if (titleId) {
            // Title Anchor
            const titleAnchor = document.createElement('a');
            titleAnchor.className = 'title-link-anchor';
            titleAnchor.href = `#${titleId}`;
            titleAnchor.innerHTML = '<i class="bi bi-hash"></i>';
            titleAnchor.setAttribute('aria-label', `Link to ${titleText}`);
            titleContainer.appendChild(titleAnchor);
        }

        groupWrapper.appendChild(titleContainer);
    }

    if (groupData.description) {
        const description = buildDescriptionElement(groupData.description);
        groupWrapper.appendChild(description);
    }

    if (Array.isArray(groupData.contents)) {
        const row = document.createElement('div');
        row.className = 'row g-0';

        groupData.contents.forEach(cardData => {
            const cardItem = buildCardItem(cardData);
            row.appendChild(cardItem);
        });

        groupWrapper.appendChild(row);
    }

    return groupWrapper;
}

/**
 * Main entry point: fetch the links JSON, clear the #links container,
 * and rebuild all link groups and cards. Handles hash-target scrolling
 * after rendering.
 * @returns {Promise<void>}
 */
async function generateLinkCards() {
    const container = document.getElementById('links');
    if (!container) {
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

        if (window.location.hash) {
            scrollToHashTarget(window.location.hash, true);
        }
    } catch (error) {
        console.error('Failed to generate link cards:', error);
        container.innerHTML = '<div class="alert alert-warning">Unable to load link cards.</div>';
    }
}

/**
 * Listen for hashchange events and scroll to the targeted element.
 */
function initHashChangeScroll() {
    window.addEventListener('hashchange', () => {
        scrollToHashTarget(window.location.hash, true);
    });
}
