/**
 * Per-page metadata for <head> tag injection.
 * Only the fields that differ between pages are defined here.
 * Common tags (icons, PWA, theme-color, etc.) are generated automatically
 * by the Vite plugin in vite.config.js.
 */

export const SITE_NAME = "Steve Hsu (什五)'s Link-Hub";
export const SITE_AUTHOR = 'Steve Hsu (什五)';
export const BASE_URL = 'https://stevehsudrawing.github.io';
export const OG_IMAGE = `${BASE_URL}/images/png/banner.png`;
export const TWITTER_CREATOR = '@stevehsudrawing';

/** @typedef {'full' | 'lightweight' | 'none'} PageTier */

/**
 * @type {Record<string, {
 *   title: string,
 *   description: string,
 *   pagePath: string,
 *   robots: string,
 *   jsonLDType: 'homepage' | 'breadcrumb',
 *   jsonLDPageName?: string,
 *   tier: PageTier,
 * }>}
 */
export const PAGE_META = {
    index: {
        title: SITE_NAME,
        description: "A curated collection of links to Steve Hsu (什五)'s artworks, software projects, social media, and more. Find all of Steve Hsu (什五)'s online presence in one place.",
        pagePath: '/',
        robots: 'index, follow',
        jsonLDType: 'homepage',
        tier: 'full',
    },
    about: {
        title: `About - ${SITE_NAME}`,
        description: 'Learn more about Steve Hsu (什五) — an artist, developer, and creator. Find contact information, emails, and ways to get in touch.',
        pagePath: '/about.html',
        robots: 'index, follow',
        jsonLDType: 'breadcrumb',
        jsonLDPageName: 'About',
        tier: 'full',
    },
    'artworks-and-videos': {
        title: `Artworks & Videos - ${SITE_NAME}`,
        description: "Explore Steve Hsu (什五)'s artworks and video creations. Links to Pixiv, art portfolios, video channels, and creative projects.",
        pagePath: '/artworks-and-videos.html',
        robots: 'index, follow',
        jsonLDType: 'breadcrumb',
        jsonLDPageName: 'Artworks & Videos',
        tier: 'full',
    },
    'blogs-and-sponsor': {
        title: `Blogs & Sponsor - ${SITE_NAME}`,
        description: "Read Steve Hsu (什五)'s blog posts and discover ways to support his work through sponsorship and donations.",
        pagePath: '/blogs-and-sponsor.html',
        robots: 'index, follow',
        jsonLDType: 'breadcrumb',
        jsonLDPageName: 'Blogs & Sponsor',
        tier: 'full',
    },
    chatting: {
        title: `Chatting - ${SITE_NAME}`,
        description: "Join Steve Hsu (什五)'s community on QQ, Discord, and other social platforms. Connect and chat with like-minded people.",
        pagePath: '/chatting.html',
        robots: 'index, follow',
        jsonLDType: 'breadcrumb',
        jsonLDPageName: 'Chatting',
        tier: 'full',
    },
    softwares: {
        title: `Softwares - ${SITE_NAME}`,
        description: 'Discover software projects by Steve Hsu (什五), including the Quanto Series and other development tools and utilities.',
        pagePath: '/softwares.html',
        robots: 'index, follow',
        jsonLDType: 'breadcrumb',
        jsonLDPageName: 'Softwares',
        tier: 'full',
    },
    '404': {
        title: `HTTP 404 - ${SITE_NAME}`,
        description: "The page you are looking for does not exist. Return to Steve Hsu (什五)'s Link-Hub homepage.",
        pagePath: '/404.html',
        robots: 'noindex',
        jsonLDType: 'none',
        tier: 'lightweight',
    },
};

/**
 * Extract page name from the HTML file path.
 * @param {string} filename - Vite's ctx.filename (absolute path).
 * @returns {string} e.g. "index", "about"
 */
export function getPageName(filename) {
    const name = filename.replace(/\\/g, '/').split('/').pop().replace('.html', '');
    return PAGE_META[name] ? name : 'index';
}
