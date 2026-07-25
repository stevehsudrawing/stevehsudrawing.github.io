/**
 * Vite plugin: pre-render page content at build time.
 *
 * Uses HAST tree manipulation (fromHtml → walk → toHtml) rather than
 * regex-based HTML string replacement.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromHtml } from 'hast-util-from-html';
import { toHtml } from 'hast-util-to-html';
import { getPageName } from './utils.js';
import { PAGE_META } from './configs/page-meta.js';
import { buildLinkCardsHTML } from './link-cards-builder.js';
import type { IndexHtmlTransformContext } from 'vite';
import type { Node } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =========================================================================
// Page component loading
// =========================================================================

function readPageComponent(name: string): string {
    const filePath = resolve(__dirname, 'page-components', `${name}.html`);
    try {
        const raw = readFileSync(filePath, 'utf-8');
        const bodyMatch = raw.match(/<body[^>]*>([\s\S]*)<\/body\s*>/i);
        return bodyMatch ? bodyMatch[1].trim() : raw;
    } catch {
        console.warn(`[content-injection] Could not read page component: ${name}`);
        return '';
    }
}

// =========================================================================
// Language menu pre-rendering
// =========================================================================

interface LanguageItem {
    code: string;
    localizedName?: string;
}

let _cachedLanguageItems: LanguageItem[] | null = null;

function readLanguageItems(): LanguageItem[] {
    if (_cachedLanguageItems) return _cachedLanguageItems;
    const filePath = resolve(__dirname, 'configs', 'language-list.json');
    try {
        const raw = readFileSync(filePath, 'utf-8');
        _cachedLanguageItems = JSON.parse(raw) as LanguageItem[];
    } catch {
        _cachedLanguageItems = [];
    }
    return _cachedLanguageItems;
}

// =========================================================================
// HAST tree operations
// =========================================================================

function processContentTree(node: Node, pageName: string): void {
    if (!node || typeof node !== 'object') return;
    if (node.type !== 'element' && node.type !== 'root') return;

    // --- Replace page-component placeholders ---
    // (fromHtml normalizes data-* attributes to camelCase, e.g. dataRole)
    if (node.type === 'element' && node.properties && (node.properties as Record<string, unknown>).dataRole === 'page-component') {
        const props = node.properties as Record<string, unknown>;
        const componentName = props.dataComponentName as string | undefined;
        if (componentName && node.children) {
            const content = readPageComponent(componentName);
            if (content) {
                const parsed = fromHtml(content, { fragment: true });
                node.children = parsed.children || [];
                delete props.dataRole;
                delete props.dataComponentName;
            }
        }
    }

    // --- Fill language menus ---
    if (node.type === 'element' && node.properties) {
        const props = node.properties as Record<string, unknown>;
        const langItems = readLanguageItems();

        if (langItems.length > 0) {
            // Header dropdown: <ul id="lang-dropdown-menu">
            if (props.id === 'lang-dropdown-menu' && node.children) {
                const listItems: Node[] = [];
                for (const item of langItems) {
                    listItems.push({
                        type: 'element', tagName: 'li', properties: {}, children: [{
                            type: 'element', tagName: 'a',
                            properties: { className: ['dropdown-item', 'lang-item'], href: '#', dataLang: item.code },
                            children: [{ type: 'text', value: item.localizedName || item.code }],
                        }],
                    });
                }
                node.children = listItems;
            }

            // Settings modal: <select id="language-select">
            if (props.id === 'language-select' && node.children) {
                const options: Node[] = [];
                for (const item of langItems) {
                    options.push({
                        type: 'element', tagName: 'option',
                        properties: { value: item.code },
                        children: [{ type: 'text', value: item.localizedName || item.code }],
                    });
                }
                node.children = options;
            }
        }
    }

    // --- Replace #links container with pre-rendered link cards ---
    if (node.type === 'element' && node.properties && (node.properties as Record<string, unknown>).id === 'links') {
        const linksHTML = buildLinkCardsHTML(pageName);
        if (linksHTML) {
            const parsed = fromHtml(linksHTML, { fragment: true });
            node.children = parsed.children || [];
        }
    }

    // Recurse into children
    if (Array.isArray(node.children)) {
        for (const child of node.children) {
            processContentTree(child, pageName);
        }
    }
}

// =========================================================================
// Plugin export
// =========================================================================

export function contentInjectionPlugin() {
    return {
        name: 'content-injection-plugin',
        transformIndexHtml: {
            order: 'pre' as const,
            handler(html: string, ctx: IndexHtmlTransformContext): string {
                const pageName = getPageName(ctx.filename);
                const meta = PAGE_META[pageName];
                if (!meta) return html;

                // Extract body content — only the body goes through HAST round-trip
                const bodyMatch = html.match(/([\s\S]*<body[^>]*>)([\s\S]*)(<\/body\s*>[\s\S]*)/i);
                if (!bodyMatch) return html;

                const beforeBody = bodyMatch[1];
                const bodyContent = bodyMatch[2];
                const afterBody = bodyMatch[3];

                const bodyTree = fromHtml(bodyContent, { fragment: true }) as unknown as Node;
                processContentTree(bodyTree, pageName);
                const newBody = toHtml(bodyTree as Parameters<typeof toHtml>[0]);

                return beforeBody + newBody + afterBody;
            },
        },
    };
}
