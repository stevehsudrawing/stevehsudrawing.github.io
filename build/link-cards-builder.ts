/**
 * Build-time link cards HTML generator.
 * Reads HAST-format JSON configs, manipulates HAST trees (adds QR buttons,
 * link attributes, etc.), and serializes to HTML strings for injection into
 * the #links container during Vite's transformIndexHtml.
 *
 * All internal operations work on HAST node trees ??never on raw HTML strings.
 * Only the final output is serialized via hast-util-to-html.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toHtml } from 'hast-util-to-html';
import { h } from 'hastscript';
import { BASE_URL, PAGE_META } from './configs/page-meta.js';
import { toDashCase, extractPlainText, cloneNode } from './utils.js';
import type { HastProperties } from '../src/types/hast.js';
import type { Node, CardData, GroupData } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// HAST tree transformations
// ---------------------------------------------------------------------------

/** Build a QR-code button as a HAST element node. */
function buildQRNode(href: string, iconProperties: HastProperties | null): Node {
    const props: Record<string, string> = {
        href: 'javascript:void(0)',
        role: 'button',
        'data-qr-url': href,
        className: 'text-decoration-none',
        'aria-label': 'Show QR Code',
        'data-bs-toggle': 'tooltip',
        'data-i18n-tooltip': 'text-show-qr-code',
        'data-bs-title': 'Show QR Code',
    };
    if (iconProperties) {
        props['data-qr-icon'] = JSON.stringify(iconProperties);
    }
    return h('a', props, [h('i.bi.bi-qr-code')]);
}

/** Decide whether a link should get a QR button appended after it. */
function shouldAddQR(href: string, props: HastProperties | undefined): boolean {
    if (!href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('javascript:')) return false;
    if (href.startsWith('mailto:')) return false;
    if (href.startsWith('tel:')) return false;
    if (props && 'data-no-qr-code' in props) return false;
    return true;
}

/**
 * Recursively walk a HAST tree and:
 * - Add `data-link-img-props` to every `<a>` element's properties.
 * - When `addQR` is true, also insert a QR button node after each qualifying
 *   `<a>` element as a sibling.
 *
 * Mutates the tree in place. Safe to call on cloned nodes.
 */
function processLinkNodes(
    node: Node,
    iconProperties: HastProperties | null,
    addQR = false,
): void {
    if (!node || typeof node !== 'object') return;

    // Process the node itself if it's an <a> element
    if (node.type === 'element' && node.tagName === 'a') {
        if (!node.properties) node.properties = {};
        if (iconProperties && !node.properties['data-link-img-props']) {
            node.properties['data-link-img-props'] = JSON.stringify(iconProperties);
        }
    }

    // Process children for both 'element' and 'root' types
    if ((node.type === 'element' || node.type === 'root') && Array.isArray(node.children)) {
        const newChildren: Node[] = [];

        for (const child of node.children) {
            processLinkNodes(child, iconProperties, addQR);
            newChildren.push(child);

            if (addQR && child.type === 'element' && child.tagName === 'a') {
                const href = child.properties?.href as string || '';
                if (shouldAddQR(href, child.properties)) {
                    newChildren.push({ type: 'text', value: ' ' });
                    newChildren.push(buildQRNode(href, iconProperties));
                }
            }
        }

        node.children = newChildren;
    }
}

/** Ensure all `<img>` elements in a HAST tree have `img-fluid img-fit` classes. */
function addImgClasses(node: Node): void {
    if (!node || typeof node !== 'object') return;

    if (node.type === 'element' && node.tagName === 'img') {
        if (!node.properties) node.properties = {};
        const current = Array.isArray(node.properties.className)
            ? node.properties.className
            : (node.properties.className || '').toString().split(/\s+/).filter(Boolean);

        for (const c of ['img-fluid', 'img-fit']) {
            if (!current.includes(c)) current.push(c);
        }
        node.properties.className = current;
    }

    if (Array.isArray(node.children)) {
        for (const child of node.children) addImgClasses(child);
    }
}

// ---------------------------------------------------------------------------
// HAST node builders (card, group)
// ---------------------------------------------------------------------------

/** Build a single link-card as a HAST element node. */
function buildCardNode(cardData: CardData): Node {
    const iconProps = cardData.icon?.properties ?? null;
    const availableClass = cardData.available !== true ? ' opacity-75' : '';

    const bodyChildren: Node[] = [];

    // --- Icon ---
    if (cardData.icon) {
        const iconNode = cloneNode(cardData.icon);
        addImgClasses(iconNode);
        bodyChildren.push(h('div.link-icon-wrapper.me-2', iconNode));
    }

    // --- Title & Description ---
    if (cardData.title || cardData.description) {
        const textChildren: Node[] = [];

        if (cardData.title) {
            const titleNode = cloneNode(cardData.title);
            processLinkNodes(titleNode, iconProps, true);
            const isSingleLink = cardData.title.type === 'element'
                && cardData.title.tagName === 'a';
            const titleClass = 'card-title'
                + (isSingleLink ? ' d-flex align-items-center justify-content-between' : '');

            const h6Children: Node[] = [titleNode];
            if (isSingleLink) {
                const href = titleNode.properties?.href as string || '';
                if (shouldAddQR(href, titleNode.properties)) {
                    h6Children.push({ type: 'text', value: ' ' });
                    h6Children.push(buildQRNode(href, iconProps));
                }
            }

            textChildren.push(h('h6' + (titleClass ? `.${titleClass.replace(/\s+/g, '.')}` : ''), ...h6Children));
        }

        if (cardData.description) {
            const descNode = cloneNode(cardData.description);
            processLinkNodes(descNode, iconProps); // addQR defaults to false
            textChildren.push(h('p.card-text', descNode));
        }

        bodyChildren.push(h('div.flex-grow-1', ...textChildren));
    }

    const wrapperClass = `card-wrapper.col-lg-6.col-xxl-4${availableClass.replace(/\s+/g, '.')}`;
    return h('div.' + wrapperClass, [
        h('div.card.flex-grow-1', [
            h('div.d-flex.card-body', ...bodyChildren),
        ]),
    ]);
}

/** Build an entire link-group section as a HAST element node. */
function buildGroupNode(groupData: GroupData, pagePath: string): Node {
    const children: Node[] = [];

    // --- Group title ---
    if (groupData.title) {
        const titleText = extractPlainText(groupData.title);
        const titleId = toDashCase(titleText);
        const titleNode = cloneNode(groupData.title);

        const h4Attrs: Record<string, string> = { class: 'title-link-group' };
        if (titleId) h4Attrs.id = titleId;
        const wrapperChildren: Node[] = [
            h(`h4`, h4Attrs, titleNode),
        ];

        if (titleId) {
            const copyUrl = `${BASE_URL}${pagePath}#${titleId}`;
            wrapperChildren.push(
                h('a.title-link-anchor', { href: `#${titleId}`, 'aria-label': `Link to ${titleText}` }, [h('i.bi.bi-hash')]),
            );
            wrapperChildren.push(
                h('a.link.title-link-anchor.copy-link', { href: '#', 'aria-label': `Copy the link to ${titleText}`, 'data-copy-text': copyUrl }, [h('i.bi.bi-link-45deg')]),
            );
        }

        children.push(h('div.title-link-group-wrapper', ...wrapperChildren));
    }

    // --- Group description ---
    if (groupData.description) {
        const descNode = cloneNode(groupData.description);
        processLinkNodes(descNode, null); // addQR defaults to false (no card icon here)
        children.push(h('p.card-text', descNode));
    }

    // --- Cards ---
    if (Array.isArray(groupData.contents) && groupData.contents.length > 0) {
        const cardNodes = groupData.contents.map(buildCardNode);
        children.push(h('div.row.g-0', ...cardNodes));
    }

    return h('div.link-hub-part', ...children);
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Read the links JSON for a page and generate the full #links HTML.
 * @param pageName - e.g. "about", "artworks-and-videos"
 * @returns The pre-rendered HTML for the #links container, or '' if the page has no links config.
 */
export function buildLinkCardsHTML(pageName: string): string {
    const jsonPath = resolve(__dirname, 'configs', 'links', `${pageName}.json`);

    let groups: GroupData[];
    try {
        const raw = readFileSync(jsonPath, 'utf-8');
        groups = JSON.parse(raw) as GroupData[];
    } catch {
        return '';
    }

    if (!Array.isArray(groups) || groups.length === 0) return '';

    const meta = PAGE_META[pageName];
    const pagePath = meta?.pagePath || `/${pageName}.html`;

    const rootChildren: Node[] = [];

    for (let i = 0; i < groups.length; i++) {
        rootChildren.push(buildGroupNode(groups[i], pagePath));
        if (i < groups.length - 1) {
            rootChildren.push(h('hr'));
        }
    }

    return rootChildren.map(n => toHtml(n as Parameters<typeof toHtml>[0])).join('');
}
