/**
 * Vite plugin: inject <head> tags.
 *
 * Content injection (page components, link cards) is handled by the
 * separate content-injection-plugin.ts.
 */

import { OG_IMAGE, TWITTER_CREATOR, PAGE_META } from "./site-meta";
import { BASE_URL, SITE_AUTHOR, SITE_NAME } from "../src/configs/site-meta";
import { getPageName } from "./utils";
import { LANGUAGE_LIST } from "../src/configs/language-list";
import indexButtonGroups from "../src/configs/link-button-groups/index.json";
import type { LinkButtonGroupData } from "../src/types/app";
import type {
  IndexHtmlTransformContext,
  IndexHtmlTransformResult,
  HtmlTagDescriptor,
} from "vite";
import type { PageMetaEntry } from "./types";

// =========================================================================
// Shared tags that are identical across ALL pages
// =========================================================================

/**
 * Generate tags shared across all pages: Apple PWA, author, favicons,
 * JavaScript-disabled noscript fallback, and browser detection script.
 * @returns Array of HTML tag descriptors injected into every page `<head>`.
 */
function commonTags(): HtmlTagDescriptor[] {
  return [
    // Common
    { tag: "meta", attrs: { charset: "utf-8" } },
    { tag: "meta", attrs: { name: "viewport", "content": "width=device-width, initial-scale=1, viewport-fit=cover" } },

    // Apple PWA
    { tag: "meta", attrs: { name: "mobile-web-app-capable", content: "yes" } },
    {
      tag: "meta",
      attrs: { name: "apple-mobile-web-app-capable", content: "yes" },
    },
    {
      tag: "meta",
      attrs: {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    },
    {
      tag: "meta",
      attrs: {
        name: "apple-mobile-web-app-title",
        content: "Steve Hsu (什五)'s Link-Hub",
      },
    },

    // Author
    { tag: "meta", attrs: { name: "author", content: SITE_AUTHOR } },

    // Favicons
    {
      tag: "link",
      attrs: {
        rel: "icon",
        href: "/images/svg/favicons/general.svg",
        type: "image/svg+xml",
      },
    },
    {
      tag: "link",
      attrs: {
        rel: "icon",
        href: "/images/png/favicons/general.png",
        type: "image/png",
        sizes: "96x96",
      },
    },
    {
      tag: "link",
      attrs: { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
    },
    {
      tag: "link",
      attrs: {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/images/png/favicons/apple-touch-icon.png",
      },
    },
    {
      tag: "link",
      attrs: {
        rel: "mask-icon",
        href: "/images/svg/favicons/safari-pinned-tab.svg",
        color: "#212529",
      },
    },

    // Legacy rel="image_src"
    { tag: "link", attrs: { rel: "image_src", content: OG_IMAGE } },

    // JavaScript-disabled fallback
    {
      tag: "noscript",
      children:
        '<meta http-equiv="refresh" content="0;url=/error-javascript-disabled.html">',
    },

    // Browser detection (runs before page load; ES5 for broad compatibility)
    {
      tag: "script",
      attrs: { type: "text/javascript", src: "/legacy/env-detection.js" },
    },
  ];
}

// =========================================================================
// Tags for full-feature pages only
// =========================================================================

/** Apple PWA splash screen spec: pixel dimensions, CSS point dimensions, and pixel ratio. */
interface SplashScreen {
  /** Output image width in pixels. */
  w: number;
  /** Output image height in pixels. */
  h: number;
  /** CSS point width (device-width / pixelRatio). */
  pw: number;
  /** CSS point height (device-height / pixelRatio). */
  ph: number;
  /** Device pixel ratio. */
  r: number;
}

/** Unique Apple device resolutions for PWA splash screens (deduplicated, portrait only). */
const SPLASH_SCREENS: SplashScreen[] = [
  { w: 2064, h: 2752, pw: 1032, ph: 1376, r: 2 },
  { w: 2048, h: 2732, pw: 1024, ph: 1366, r: 2 },
  { w: 1668, h: 2420, pw: 834, ph: 1210, r: 2 },
  { w: 1668, h: 2388, pw: 834, ph: 1194, r: 2 },
  { w: 1668, h: 2224, pw: 834, ph: 1112, r: 2 },
  { w: 1640, h: 2360, pw: 820, ph: 1180, r: 2 },
  { w: 1620, h: 2160, pw: 810, ph: 1080, r: 2 },
  { w: 1536, h: 2048, pw: 768, ph: 1024, r: 2 },
  { w: 1488, h: 2266, pw: 744, ph: 1133, r: 2 },
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
  { w: 1080, h: 1920, pw: 414, ph: 736, r: 3 },
  { w: 828, h: 1792, pw: 414, ph: 896, r: 2 },
  { w: 750, h: 1334, pw: 375, ph: 667, r: 2 },
  { w: 640, h: 1136, pw: 320, ph: 568, r: 2 },
];

/** Generate `<link rel="apple-touch-startup-image">` tags for all splash screen resolutions. */
function splashTags(): HtmlTagDescriptor[] {
  return SPLASH_SCREENS.map(({ w, h, pw, ph, r }) => ({
    tag: "link",
    attrs: {
      rel: "apple-touch-startup-image",
      href: `/images/png/splash/apple-splash-${w}-${h}.png`,
      media: `(device-width: ${pw}px) and (device-height: ${ph}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    },
  }));
}

/** Generate tags exclusive to full-tier pages: splash screens, manifest, sitemap, theme-color. */
function fullPageTags(): HtmlTagDescriptor[] {
  return [
    { tag: "link", attrs: { rel: "manifest", href: "/manifest.json" } },
    {
      tag: "link",
      attrs: {
        rel: "sitemap",
        type: "application/xml",
        title: "Sitemap",
        href: "/sitemap.xml",
      },
    },
    {
      tag: "meta",
      attrs: {
        name: "theme-color",
        content: "#212529",
        media: "(prefers-color-scheme: dark)",
      },
    },
    {
      tag: "meta",
      attrs: {
        name: "theme-color",
        content: "#ffffff",
        media: "(prefers-color-scheme: light)",
      },
    },
    ...splashTags(),
  ];
}

/**
 * llms.txt discovery tags for full pages: the clean markdown version
 * (rel="alternate" type="text/markdown") and the covering llms.txt
 * (rel="describedby"), per the llms.txt v2 spec.
 * @param pageName - Page name (e.g. "about"); the index page is "index".
 * @returns Two `<link>` tag descriptors.
 */
function llmsTags(pageName: string): HtmlTagDescriptor[] {
  return [
    {
      tag: "link",
      attrs: {
        rel: "alternate",
        type: "text/markdown",
        href: `/${pageName}.html.md`,
      },
    },
    { tag: "link", attrs: { rel: "describedby", href: "/llms.txt" } },
  ];
}

// =========================================================================
// Per-page tags
// =========================================================================

/** Generate Open Graph meta tags for social sharing previews. */
function ogTags(meta: PageMetaEntry): HtmlTagDescriptor[] {
  return [
    { tag: "meta", attrs: { property: "og:type", content: "website" } },
    {
      tag: "meta",
      attrs: { property: "og:url", content: `${BASE_URL}${meta.pagePath}` },
    },
    { tag: "meta", attrs: { property: "og:title", content: meta.title } },
    {
      tag: "meta",
      attrs: { property: "og:description", content: meta.description },
    },
    { tag: "meta", attrs: { property: "og:image", content: OG_IMAGE } },
    { tag: "meta", attrs: { property: "og:image:width", content: "1200" } },
    { tag: "meta", attrs: { property: "og:image:height", content: "630" } },
    { tag: "meta", attrs: { property: "og:site_name", content: SITE_NAME } },
    { tag: "meta", attrs: { property: "og:locale", content: "en_US" } },
    {
      tag: "meta",
      attrs: { property: "og:locale:alternate", content: "zh_Hans_CN" },
    },
    {
      tag: "meta",
      attrs: { property: "og:locale:alternate", content: "zh_Hant_TW" },
    },
  ];
}

/** Generate Twitter/X Card meta tags (summary_large_image format). */
function twitterTags(meta: PageMetaEntry): HtmlTagDescriptor[] {
  return [
    {
      tag: "meta",
      attrs: { name: "twitter:card", content: "summary_large_image" },
    },
    { tag: "meta", attrs: { name: "twitter:title", content: meta.title } },
    {
      tag: "meta",
      attrs: { name: "twitter:description", content: meta.description },
    },
    { tag: "meta", attrs: { name: "twitter:image", content: OG_IMAGE } },
    {
      tag: "meta",
      attrs: { name: "twitter:creator", content: TWITTER_CREATOR },
    },
  ];
}

/** Canonical codes of all supported languages (derived from the config). */
const LANGUAGE_CODES = LANGUAGE_LIST.map((lang) => lang.code);

/**
 * Personal profile URLs for JSON-LD `sameAs` — the single source of truth
 * is the index link-button config (buttons flagged with `sameAs: true`).
 */
const SOCIAL_PROFILE_URLS: string[] = (
  indexButtonGroups as LinkButtonGroupData[]
)
  .flatMap((group) => group.buttons)
  .filter((button) => button.link.type === "external" && button.sameAs)
  .map((button) => button.link.href);

/** Generate hreflang `<link>` tags for each supported language plus x-default. */
function hreflangTags(meta: PageMetaEntry): HtmlTagDescriptor[] {
  const url = `${BASE_URL}${meta.pagePath}`;
  const tags: HtmlTagDescriptor[] = LANGUAGE_LIST.map((lang) => ({
    tag: "link",
    attrs: {
      rel: "alternate",
      hreflang: lang.code,
      href: `${url}?lang=${lang.code}`,
    },
  }));
  tags.push({
    tag: "link",
    attrs: { rel: "alternate", hreflang: "x-default", href: url },
  });
  return tags;
}

/** Generate basic SEO tags: `<title>`, description, robots, and canonical URL. */
function seoTags(meta: PageMetaEntry): HtmlTagDescriptor[] {
  return [
    { tag: "title", children: meta.title },
    { tag: "meta", attrs: { name: "description", content: meta.description } },
    { tag: "meta", attrs: { name: "robots", content: meta.robots } },
    {
      tag: "link",
      attrs: { rel: "canonical", href: `${BASE_URL}${meta.pagePath}` },
    },
  ];
}

/** Generate JSON-LD structured data `<script>` tags based on the page's jsonLDType. */
function structuredData(meta: PageMetaEntry): HtmlTagDescriptor[] {
  if (meta.jsonLDType === "homepage") {
    return [
      {
        tag: "script",
        attrs: { type: "application/ld+json" },
        children: homepageJSONLD(),
      },
      {
        tag: "script",
        attrs: { type: "application/ld+json" },
        children: websiteJSONLD(),
      },
    ];
  }
  if (meta.jsonLDType === "breadcrumb") {
    return [
      {
        tag: "script",
        attrs: { type: "application/ld+json" },
        children: breadcrumbJSONLD(meta),
      },
    ];
  }
  return [];
}

/** Generate JSON-LD Person schema for the homepage with sameAs social links. */
function homepageJSONLD(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Steve Hsu",
    alternateName: ["什五", "Steve Hsu (什五)"],
    url: `${BASE_URL}/`,
    sameAs: SOCIAL_PROFILE_URLS,
    description: "Amateur creator - draws, makes videos, and codes sometimes.",
    email: "stevehsudrawing@outlook.com",
    image: OG_IMAGE,
    knowsLanguage: LANGUAGE_CODES,
    gender: "Male",
  });
}

/** Generate JSON-LD WebSite schema with SearchAction for the homepage. */
function websiteJSONLD(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    description:
      "A curated collection of links to Steve Hsu (什五)'s artworks, software projects, social media, and more.",
    inLanguage: LANGUAGE_CODES,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });
}

/** Generate JSON-LD BreadcrumbList schema for sub-pages (Home -> Page Name). */
function breadcrumbJSONLD(meta: PageMetaEntry): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: meta.jsonLDPageName,
        item: `${BASE_URL}${meta.pagePath}`,
      },
    ],
  });
}

// =========================================================================
// Plugin export
// =========================================================================

/**
 * Vite plugin that injects all `<head>` tags at build time.
 *
 * Generates SEO meta tags (title, description, robots, canonical), Open Graph,
 * Twitter Cards, hreflang alternates, JSON-LD structured data, favicons, PWA
 * tags, splash screens, and the appropriate entry script based on page tier.
 * Only charset and viewport remain in source HTML files.
 * @returns A Vite plugin object with a transformIndexHtml hook.
 */
export function headTagsPlugin() {
  return {
    name: "head-tags-plugin",
    transformIndexHtml: {
      order: "pre" as const,
      handler(
        html: string,
        ctx: IndexHtmlTransformContext,
      ): IndexHtmlTransformResult {
        const pageName = getPageName(ctx.filename);
        const meta = PAGE_META[pageName];
        if (!meta) return html;

        const isFull = meta.tier === "full";

        const tags = [
          ...commonTags(),
          ...seoTags(meta),
          ...ogTags(meta),
          ...twitterTags(meta),
          ...hreflangTags(meta),
          ...(isFull ? [...fullPageTags(), ...llmsTags(pageName)] : []),
          ...structuredData(meta),
          { tag: "script", attrs: { type: "module", src: "/main.ts" } },
        ];

        return { html, tags };
      },
    },
  };
}
