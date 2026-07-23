/**
 * Link-cards generator.
 * Reads a JSON configuration file in hybrid hast format, builds card groups
 * using hast-util-to-html for content subtrees, and injects them into the
 * #links container. QR buttons and title anchors are added via post-processing.
 *
 * Dependencies:
 * - window.toHtml (hast-util-to-html, loaded via ESM import in the page)
 * - setElementAttributes (utils.js)
 */

import type { HastProperties, HastNode, CardData, GroupData } from '../../types/hast.js';
import { scrollToHashTarget } from '../core/accessibility.js';
import { extractPageName, setElementAttributes } from '../core/utils.js';

/**
 * Determine which JSON file to load based on the current page or a
 * data-links-json attribute on the #links container.
 * @returns The resolved JSON path (e.g. '/configs/links/about.json').
 */
export function resolveLinksJsonPath(): string {
    const container = document.getElementById('links');
    if (container && container.dataset.linksJson) {
        return container.dataset.linksJson;
    }

    const baseName = extractPageName(window.location.pathname);
    return `/configs/links/${baseName}.json`;
}

/**
 * Convert arbitrary text to a URL-safe dash-case slug.
 * Strips special characters, replaces whitespace/underscores with hyphens,
 * and collapses consecutive hyphens.
 * @param text - The input text.
 * @returns The dash-case slug.
 */
export function toDashCase(text: string): string {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]+/gu, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Recursively extract all plain text from a hast node tree.
 * Used to derive title IDs from group-title hast subtrees.
 * @param node - A hast node.
 * @returns Concatenated plain text.
 */
export function extractPlainText(node: HastNode | null): string {
    if (!node || typeof node !== 'object') return '';
    if (node.type === 'text') return node.value || '';
    if (node.type === 'comment') return '';
    if (Array.isArray(node.children)) {
        return node.children.map(extractPlainText).join('');
    }
    return '';
}

/**
 * Create a QR-code button element for a given link URL.
 * The button opens the QR code modal with an optional centre icon.
 * @param href - The link URL to encode.
 * @param iconProperties - Icon properties to display in the QR modal.
 * @returns The QR button element.
 */
export function createQRButton(href: string, iconProperties?: Record<string, unknown> | null): HTMLAnchorElement {
    const qrButton = document.createElement('a');
    qrButton.setAttribute('href', 'javascript:void(0)');
    qrButton.setAttribute('role', 'button');
    qrButton.setAttribute('data-qr-url', href);

    if (iconProperties) {
        qrButton.setAttribute('data-qr-icon', JSON.stringify(iconProperties));
    }

    qrButton.className = 'text-decoration-none';
    qrButton.setAttribute('aria-label', 'Show QR Code');
    qrButton.setAttribute('data-bs-toggle', 'tooltip');
    qrButton.setAttribute('data-i18n-tooltip', 'text-show-qr-code');
    qrButton.setAttribute('data-bs-title', 'Show QR Code');

    const qrIcon = document.createElement('i');
    qrIcon.className = 'bi bi-qr-code';
    qrButton.appendChild(qrIcon);

    return qrButton;
}

/**
 * Scan an element for external links: append QR-code buttons and inject
 * data-link-img-props for the confirmation modal icon.
 * Used as post-processing after hast subtrees are rendered via innerHTML.
 * @param container - The container to scan for links.
 * @param iconProperties - Icon properties for the QR modal centre icon.
 * @param propsJson - JSON-stringified icon properties for data-link-img-props.
 */
export function addQRButtonsToElement(
    container: HTMLElement,
    iconProperties?: Record<string, unknown> | null,
    propsJson?: string | null
): void {
    if (!container) return;

    container.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');

        // Inject icon properties for the confirmation modal on every link.
        if (propsJson) {
            link.setAttribute('data-link-img-props', propsJson);
        }

        // Skip QR buttons for non-web links.
        if (!href || href.startsWith('#') || href.startsWith('javascript:') ||
            href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }

        const qrButton = createQRButton(href, iconProperties);
        link.after(' ', qrButton);
    });
}

/**
 * Build a single card column from card descriptor data.
 * @param cardData - Card descriptor with `available`, `icon`, `title`, `description`.
 * @returns The column element containing the card.
 */
export function buildCardItem(cardData: CardData): HTMLDivElement {
    const column = document.createElement('div');
    column.className = 'card-wrapper col-lg-6 col-xxl-4';

    if (cardData.available !== true) {
        column.classList.add('opacity-75');
    }

    const card = document.createElement('div');
    card.className = 'card flex-grow-1';

    const cardBody = document.createElement('div');
    cardBody.className = 'd-flex card-body';

    // --- Icon ---
    if (cardData.icon) {
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'link-icon-wrapper me-2';
        iconWrapper.innerHTML = window.toHtml(cardData.icon as Parameters<typeof window.toHtml>[0]);

        // Ensure the <img> has the required Bootstrap classes.
        const img = iconWrapper.querySelector('img');
        if (img) {
            img.classList.add('img-fluid', 'img-fit');
        }

        cardBody.appendChild(iconWrapper);
    }

    // --- Title & Description ---
    if (cardData.title || cardData.description) {
        const textContainer = document.createElement('div');
        textContainer.className = 'flex-grow-1';

        // Card icon properties: used for QR buttons and confirmation-modal icon.
        const iconProps = (cardData.icon as Record<string, unknown> | undefined)?.properties as Record<string, unknown> | null || null;
        const propsJson = iconProps ? JSON.stringify(iconProps) : null;

        if (cardData.title) {
            const titleHast = cardData.title;
            const h6 = document.createElement('h6');
            h6.className = 'card-title';

            // When the title is a single <a>, use flex layout for the QR button.
            const isSingleLink = titleHast.type === 'element'
                && (titleHast as unknown as Record<string, unknown>).tagName === 'a';
            if (isSingleLink) {
                h6.classList.add('d-flex', 'align-items-center', 'justify-content-between');
            }

            h6.innerHTML = window.toHtml(titleHast as Parameters<typeof window.toHtml>[0]);

            // Add QR buttons and icon properties for the title links.
            addQRButtonsToElement(h6, iconProps, propsJson);

            textContainer.appendChild(h6);
        }

        if (cardData.description) {
            const p = document.createElement('p');
            p.className = 'card-text';
            p.innerHTML = window.toHtml(cardData.description as Parameters<typeof window.toHtml>[0]);

            // Inject icon properties for the description links (no QR buttons).
            if (propsJson) {
                p.querySelectorAll('a[href]').forEach(link => {
                    link.setAttribute('data-link-img-props', propsJson);
                });
            }

            textContainer.appendChild(p);
        }

        cardBody.appendChild(textContainer);
    }

    card.appendChild(cardBody);
    column.appendChild(card);
    return column;
}

/**
 * Add a hash anchor and copy-link button after an h4 group title.
 * @param h4 - The group title element.
 * @param titleId - The dash-case ID derived from the title text.
 * @param titleText - The raw title text (for aria-label).
 */
export function addTitleAnchors(h4: HTMLHeadingElement, titleId: string, titleText: string): void {
    const titleContainer = h4.parentNode as HTMLElement;

    // Hash anchor
    const titleAnchor = document.createElement('a');
    titleAnchor.className = 'title-link-anchor';
    titleAnchor.href = `#${titleId}`;
    titleAnchor.innerHTML = '<i class="bi bi-hash"></i>';
    titleAnchor.setAttribute('aria-label', `Link to ${titleText}`);
    titleContainer.appendChild(titleAnchor);

    // Copy-link anchor
    const copyUrl = `${window.location.origin}${window.location.pathname}#${titleId}`;
    const copyAnchor = document.createElement('a');
    copyAnchor.className = 'link title-link-anchor copy-link';
    copyAnchor.href = '#';
    copyAnchor.setAttribute('aria-label', `Copy the link to ${titleText}`);
    copyAnchor.setAttribute('data-copy-text', copyUrl);
    copyAnchor.innerHTML = '<i class="bi bi-link-45deg"></i>';
    titleContainer.appendChild(copyAnchor);
}

/**
 * Build an entire link group section from group descriptor data.
 * @param groupData - Group descriptor with `title`, `description`, `contents`.
 * @returns The group wrapper element.
 */
export function buildLinkGroup(groupData: GroupData): HTMLDivElement {
    const groupWrapper = document.createElement('div');
    groupWrapper.className = 'link-hub-part';

    // --- Group title ---
    if (groupData.title) {
        const titleText = extractPlainText(groupData.title);
        const titleId = toDashCase(titleText);

        const titleContainer = document.createElement('div');
        titleContainer.className = 'title-link-group-wrapper';

        const h4 = document.createElement('h4');
        h4.className = 'title-link-group';
        if (titleId) {
            h4.id = titleId;
        }
        h4.innerHTML = window.toHtml(groupData.title as Parameters<typeof window.toHtml>[0]);
        titleContainer.appendChild(h4);

        if (titleId) {
            addTitleAnchors(h4, titleId, titleText);
        }

        groupWrapper.appendChild(titleContainer);
    }

    // --- Group description ---
    if (groupData.description) {
        const p = document.createElement('p');
        p.className = 'card-text';
        p.innerHTML = window.toHtml(groupData.description as Parameters<typeof window.toHtml>[0]);
        groupWrapper.appendChild(p);
    }

    // --- Cards ---
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
 */
export async function generateLinkCards(): Promise<void> {
    const container = document.getElementById('links');
    if (!container) {
        return;
    }

    if (typeof window.toHtml !== 'function') {
        console.error('window.toHtml (hast-util-to-html) is not available. Ensure the ESM import is loaded.');
        container.innerHTML = '<div class="alert alert-warning">Link card renderer not available.</div>';
        return;
    }

    try {
        const linksJsonPath = resolveLinksJsonPath();
        const response = await fetch(linksJsonPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${linksJsonPath}: ${response.status}`);
        }

        const groups: GroupData[] = await response.json();
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
export function initHashChangeScroll(): void {
    window.addEventListener('hashchange', () => {
        scrollToHashTarget(window.location.hash, true);
    });
}
