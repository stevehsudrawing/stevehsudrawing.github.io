import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { minify } from 'html-minifier-terser';
import {
    BASE_URL,
    OG_IMAGE,
    SITE_AUTHOR,
    SITE_NAME,
    TWITTER_CREATOR,
    getPageName,
    PAGE_META,
} from './src/configs/page-meta.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// =========================================================================
// Shared tags that are identical across ALL pages
// =========================================================================

function commonTags() {
    return [
        // Apple PWA
        { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' } },
        { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: "Steve Hsu's Link-Hub" } },

        // Author
        { tag: 'meta', attrs: { name: 'author', content: SITE_AUTHOR } },

        // Favicons
        { tag: 'link', attrs: { rel: 'icon', href: '/images/svg/favicons/general.svg', type: 'image/svg+xml' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/images/png/favicons/general.png', type: 'image/png', sizes: '96x96' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.ico', sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/images/png/favicons/apple-touch-icon.png' } },
        { tag: 'link', attrs: { rel: 'mask-icon', href: '/images/svg/favicons/safari-pinned-tab.svg', color: '#212529' } },

        // JavaScript-disabled fallback
        { tag: 'noscript', children: '<meta http-equiv="refresh" content="0;url=/error-javascript-disabled.html">' },

        // Browser detection (runs before page load; ES5 for broad compatibility)
        { tag: 'script', attrs: { type: 'text/javascript', src: '/legacy/env-detection.js' } },
    ];
}

// =========================================================================
// Tags for full-feature pages only
// =========================================================================

// Apple PWA splash screen definitions.
// Each entry maps pixel dimensions → CSS point dimensions + pixel ratio.
// Data source: Apple Human Interface Guidelines — Device Screen Sizes.
const SPLASH_SCREENS = [
    // --- iPads (@2x) ---
    { w: 2064, h: 2752, pw: 1032, ph: 1376, r: 2 },
    { w: 2048, h: 2732, pw: 1024, ph: 1366, r: 2 },
    { w: 1668, h: 2420, pw: 834,  ph: 1210, r: 2 },
    { w: 1668, h: 2388, pw: 834,  ph: 1194, r: 2 },
    { w: 1668, h: 2224, pw: 834,  ph: 1112, r: 2 },
    { w: 1640, h: 2360, pw: 820,  ph: 1180, r: 2 },
    { w: 1620, h: 2160, pw: 810,  ph: 1080, r: 2 },
    { w: 1536, h: 2048, pw: 768,  ph: 1024, r: 2 },
    { w: 1488, h: 2266, pw: 744,  ph: 1133, r: 2 },
    // --- iPhones (@3x) ---
    { w: 1320, h: 2868, pw: 440, ph: 956, r: 3 },
    { w: 1290, h: 2796, pw: 430, ph: 932, r: 3 },
    { w: 1284, h: 2778, pw: 428, ph: 926, r: 3 },
    { w: 1260, h: 2736, pw: 420, ph: 912, r: 3 },
    { w: 1242, h: 2688, pw: 414, ph: 896, r: 3 },
    { w: 1206, h: 2622, pw: 402, ph: 874, r: 3 },
    { w: 1179, h: 2556, pw: 393, ph: 852, r: 3 },
    { w: 1170, h: 2532, pw: 390, ph: 844, r: 3 },
    { w: 1125, h: 2436, pw: 375, ph: 812, r: 3 },
    { w: 1080, h: 2340, pw: 360, ph: 780, r: 3 },
    // --- iPhones (mixed ratios) ---
    { w: 1080, h: 1920, pw: 414, ph: 736, r: 3 },  // Plus models (downsampled)
    { w: 828,  h: 1792, pw: 414, ph: 896, r: 2 },  // iPhone 11 / XR
    { w: 750,  h: 1334, pw: 375, ph: 667, r: 2 },  // iPhone 6/7/8 / SE
    { w: 640,  h: 1136, pw: 320, ph: 568, r: 2 },  // iPhone SE (1st) / iPod touch
];

function splashTags() {
    return SPLASH_SCREENS.map(({ w, h, pw, ph, r }) => ({
        tag: 'link',
        attrs: {
            rel: 'apple-touch-startup-image',
            href: `/images/png/splash/apple-splash-${w}-${h}.png`,
            media: `(device-width: ${pw}px) and (device-height: ${ph}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
        },
    }));
}

function fullPageTags() {
    return [
        ...splashTags(),
        { tag: 'link', attrs: { rel: 'manifest', href: '/manifest.json' } },
        { tag: 'link', attrs: { rel: 'sitemap', type: 'application/xml', title: 'Sitemap', href: '/sitemap.xml' } },

        // Browser UI theme-color
        { tag: 'meta', attrs: { name: 'theme-color', content: '#212529', media: '(prefers-color-scheme: dark)' } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' } },
    ];
}

// =========================================================================
// Per-page tags
// =========================================================================

function ogTags(meta) {
    return [
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:url', content: `${BASE_URL}${meta.pagePath}` } },
        { tag: 'meta', attrs: { property: 'og:title', content: meta.title } },
        { tag: 'meta', attrs: { property: 'og:description', content: meta.description } },
        { tag: 'meta', attrs: { property: 'og:image', content: OG_IMAGE } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
        { tag: 'meta', attrs: { property: 'og:locale', content: 'en_US' } },
        { tag: 'meta', attrs: { property: 'og:locale:alternate', content: 'zh_Hans_CN' } },
        { tag: 'meta', attrs: { property: 'og:locale:alternate', content: 'zh_Hant_TW' } },
    ];
}

function twitterTags(meta) {
    return [
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:title', content: meta.title } },
        { tag: 'meta', attrs: { name: 'twitter:description', content: meta.description } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: OG_IMAGE } },
        { tag: 'meta', attrs: { name: 'twitter:creator', content: TWITTER_CREATOR } },
    ];
}

function hreflangTags(meta) {
    const url = `${BASE_URL}${meta.pagePath}`;
    return [
        { tag: 'link', attrs: { rel: 'alternate', hreflang: 'en', href: `${url}?lang=en` } },
        { tag: 'link', attrs: { rel: 'alternate', hreflang: 'zh-Hans', href: `${url}?lang=zh-Hans` } },
        { tag: 'link', attrs: { rel: 'alternate', hreflang: 'zh-Hant', href: `${url}?lang=zh-Hant` } },
        { tag: 'link', attrs: { rel: 'alternate', hreflang: 'x-default', href: url } },
    ];
}

function seoTags(meta) {
    return [
        { tag: 'title', children: meta.title },
        { tag: 'meta', attrs: { name: 'description', content: meta.description } },
        { tag: 'meta', attrs: { name: 'robots', content: meta.robots } },
        { tag: 'link', attrs: { rel: 'canonical', href: `${BASE_URL}${meta.pagePath}` } },
    ];
}

function structuredData(meta) {
    if (meta.jsonLDType === 'homepage') {
        return [
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: homepageJSONLD() },
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: websiteJSONLD() },
        ];
    }
    if (meta.jsonLDType === 'breadcrumb') {
        return [
            { tag: 'script', attrs: { type: 'application/ld+json' }, children: breadcrumbJSONLD(meta) },
        ];
    }
    return [];
}

function homepageJSONLD() {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Steve Hsu',
        alternateName: ['什五', 'Steve Hsu (什五)'],
        url: `${BASE_URL}/`,
        sameAs: [
            'https://www.pixiv.net/users/70732361',
            'https://www.deviantart.com/stevehsudrawing',
            'https://x.com/stevehsudrawing',
            'https://weibo.com/stevehsudrawing',
            'https://space.bilibili.com/298733903',
            'https://github.com/stevehsudrawing',
            'https://medibang.com/u/stevehsu',
            'https://www.patreon.com/QuantoSeries',
        ],
        description: 'Amateur creator — draws, makes videos, and codes sometimes.',
        email: 'stevehsudrawing@outlook.com',
        image: OG_IMAGE,
        knowsLanguage: ['en', 'zh-Hans', 'zh-Hant'],
        gender: 'Male',
    });
}

function websiteJSONLD() {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: `${BASE_URL}/`,
        description: "A curated collection of links to Steve Hsu (什五)'s artworks, software projects, social media, and more.",
        inLanguage: ['en', 'zh-Hans', 'zh-Hant'],
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${BASE_URL}/?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    });
}

function breadcrumbJSONLD(meta) {
    return JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
            { '@type': 'ListItem', position: 2, name: meta.jsonLDPageName, item: `${BASE_URL}${meta.pagePath}` },
        ],
    });
}

// =========================================================================
// Build-time asset minification (closeBundle hook)
// =========================================================================

/** Recursively collect file paths with the given extension(s). */
function walkDir(dir, extensions) {
    const results = [];
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

/** Minify a single .html file — preserves JSON-LD structured data blocks. */
async function minifyHTML(filePath) {
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

/** Minify .json → compact single-line output. */
function minifyJSON(filePath) {
    const original = readFileSync(filePath, 'utf-8');
    const compact = JSON.stringify(JSON.parse(original));
    writeFileSync(filePath, compact);
}

/** Minify static .css — strip comments and collapse whitespace. */
function minifyStaticCSS(filePath) {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/\/\*[\s\S]*?\*\//g, '')       // remove comments
        .replace(/[ \t]*\n[ \t]*/g, '\n')       // collapse blank lines
        .replace(/;[ \t]+/g, ';')               // space after semicolons
        .replace(/[ \t]*\{[ \t]*/g, '{')        // space before {
        .replace(/\}[ \t]*\n/g, '}\n')          // space after }
        .trim();
    writeFileSync(filePath, result);
}

/** Minify static .js (legacy ES5) — strip comments and collapse whitespace. */
function minifyStaticJS(filePath) {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/\/\/.*$/gm, '')                // single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')        // block comments
        .replace(/[ \t]*\n[ \t]*/g, '\n')        // collapse blank lines
        .replace(/\n{2,}/g, '\n')                // no more than 1 blank line
        .trim();
    writeFileSync(filePath, result);
}

/** Minify .xml — strip whitespace between tags. */
function minifyXML(filePath) {
    const original = readFileSync(filePath, 'utf-8');
    const result = original
        .replace(/>\s+</g, '><')
        .replace(/^\s+/, '')
        .trim();
    writeFileSync(filePath, result);
}

// =========================================================================
// Vite plugin: inject all <head> tags + minify dist output
// =========================================================================

function injectHeadTags() {
    return {
        name: 'inject-head-tags',
        transformIndexHtml: {
            order: 'pre',
            handler(html, ctx) {
                const pageName = getPageName(ctx.filename);
                const meta = PAGE_META[pageName];
                if (!meta) return html;

                const isFull = meta.tier === 'full';
                const entryScript = meta.tier === 'lightweight'
                    ? { tag: 'script', attrs: { type: 'module', src: '/src/main-lightweight.ts' } }
                    : { tag: 'script', attrs: { type: 'module', src: '/src/main.ts' } };

                const tags = [
                    ...commonTags(),
                    ...(isFull ? fullPageTags() : []),
                    ...seoTags(meta),
                    ...hreflangTags(meta),
                    ...ogTags(meta),
                    ...twitterTags(meta),
                    entryScript,
                    ...structuredData(meta),
                ];

                return { html, tags };
            },
        },

        async closeBundle() {
            const distDir = resolve(__dirname, 'dist');

            // --- HTML ---
            const htmlFiles = walkDir(distDir, ['.html']);
            for (const f of htmlFiles) await minifyHTML(f);

            // --- JSON ---
            const jsonFiles = walkDir(distDir, ['.json']);
            for (const f of jsonFiles) minifyJSON(f);

            // --- Static CSS (legacy only; Vite bundles are already minified) ---
            const cssFiles = walkDir(distDir, ['.css']).filter(f => f.includes('legacy'));
            for (const f of cssFiles) minifyStaticCSS(f);

            // --- Static JS (legacy only) ---
            const jsFiles = walkDir(distDir, ['.js']).filter(f => f.includes('legacy'));
            for (const f of jsFiles) minifyStaticJS(f);

            // --- XML ---
            const xmlFiles = walkDir(distDir, ['.xml']);
            for (const f of xmlFiles) minifyXML(f);
        },
    };
}

// =========================================================================
// Main config
// =========================================================================

export default defineConfig({
    base: '/',

    plugins: [injectHeadTags()],

    server: {
        port: 5173,
        open: true,
    },

    publicDir: 'public',

    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                about: resolve(__dirname, 'about.html'),
                'artworks-and-videos': resolve(__dirname, 'artworks-and-videos.html'),
                'blogs-and-sponsor': resolve(__dirname, 'blogs-and-sponsor.html'),
                chatting: resolve(__dirname, 'chatting.html'),
                softwares: resolve(__dirname, 'softwares.html'),
                '404': resolve(__dirname, '404.html'),
            },
        },
    },
});
