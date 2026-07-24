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

// Internal HAST node type: see link-cards-builder.ts for rationale.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

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
