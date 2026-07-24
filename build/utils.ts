/**
 * Shared build-time utilities.
 * Used by multiple build scripts (link-cards-builder, minify-plugin, etc.).
 */

import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ---------------------------------------------------------------------------
// HAST utilities
// ---------------------------------------------------------------------------

/** Convert arbitrary text to a URL-safe dash-case slug. */
export function toDashCase(text: string | undefined | null): string {
    return String(text || '')
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]+/gu, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Recursively extract all plain text from a hast node tree. */
export function extractPlainText(node: unknown): string {
    if (!node || typeof node !== 'object') return '';
    const n = node as Record<string, unknown>;
    if (n.type === 'text') return String(n.value || '');
    if (n.type === 'comment') return '';
    if (Array.isArray(n.children)) {
        return n.children.map(extractPlainText).join('');
    }
    return '';
}

/** Deep-clone a HAST node via JSON round-trip. */
export function cloneNode<T>(node: T): T {
    return JSON.parse(JSON.stringify(node)) as T;
}

/**
 * Extract the page name from a Vite ctx.filename (absolute path).
 * @returns e.g. "index", "about"
 */
export function getPageName(filename: string): string {
    return filename.replace(/\\/g, '/').split('/').pop()!.replace('.html', '');
}

// ---------------------------------------------------------------------------
// Filesystem utilities
// ---------------------------------------------------------------------------

/** Recursively collect file paths with the given extension(s). */
export function walkDir(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    const list = readdirSync(dir);
    for (const name of list) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            results.push(...walkDir(full, extensions));
        } else if (extensions.includes(extname(name))) {
            results.push(full);
        }
    }
    return results;
}
