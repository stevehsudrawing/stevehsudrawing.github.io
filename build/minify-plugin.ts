/**
 * Vite plugin: minify static assets after build.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';
import { walkDir } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =========================================================================
// Minifiers
// =========================================================================

async function minifyHTML(filePath: string): Promise<void> {
    const original = readFileSync(filePath, 'utf-8');
    const result = await minify(original, {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        minifyCSS: true,
        minifyJS: true,
        ignoreCustomFragments: [
            /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
            /<noscript>[\s\S]*?<\/noscript>/,
        ],
    });
    writeFileSync(filePath, result);
}

function minifyJSON(filePath: string): void {
    const original = readFileSync(filePath, 'utf-8');
    const compact = JSON.stringify(JSON.parse(original));
    writeFileSync(filePath, compact);
}

function minifyStaticCSS(filePath: string): void {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/;[ \t]+/g, ';')
        .replace(/[ \t]*\{[ \t]*/g, '{')
        .replace(/\}[ \t]*\n/g, '}\n')
        .trim();
    writeFileSync(filePath, result);
}

function minifyStaticJS(filePath: string): void {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
    writeFileSync(filePath, result);
}

function minifyXML(filePath: string): void {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/>\s+</g, '><')
        .replace(/^\s+/, '')
        .trim();
    writeFileSync(filePath, result);
}

// =========================================================================
// Plugin export
// =========================================================================

export function minifyPlugin() {
    return {
        name: 'minify-plugin',
        async closeBundle(): Promise<void> {
            const distDir = resolve(__dirname, '..', 'dist');

            const htmlFiles = walkDir(distDir, ['.html']);
            for (const f of htmlFiles) await minifyHTML(f);

            const jsonFiles = walkDir(distDir, ['.json']);
            for (const f of jsonFiles) minifyJSON(f);

            const cssFiles = walkDir(distDir, ['.css']).filter(f => f.includes('legacy'));
            for (const f of cssFiles) minifyStaticCSS(f);

            const jsFiles = walkDir(distDir, ['.js']).filter(f => f.includes('legacy'));
            for (const f of jsFiles) minifyStaticJS(f);

            const xmlFiles = walkDir(distDir, ['.xml']);
            for (const f of xmlFiles) minifyXML(f);
        },
    };
}
