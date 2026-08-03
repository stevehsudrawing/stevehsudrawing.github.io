/**
 * Per-page metadata for <head> tag injection.
 * Only the fields that differ between pages are defined here.
 * Common tags (icons, PWA, theme-color, etc.) are generated automatically
 * by the head-tags-plugin.
 */

import type { PageMetaMap } from "../types";

/** Site name used in `<title>`, OG tags, JSON-LD, and PWA manifest. */
export const SITE_NAME = "Steve Hsu (什五)'s Link-Hub";
/** Site author used in `<meta name="author">`. */
export const SITE_AUTHOR = "Steve Hsu (什五)";
/** Canonical base URL of the deployed site. */
export const BASE_URL = "https://stevehsudrawing.github.io";
/** Absolute URL of the Open Graph / Twitter Card share image (1200x630). */
export const OG_IMAGE = `${BASE_URL}/images/png/banner.png`;
/** Twitter/X handle for `twitter:creator` meta tag. */
export const TWITTER_CREATOR = "@stevehsudrawing";

/** Per-page metadata map that drives head-tag generation and page tier selection. */
export const PAGE_META: PageMetaMap = {
  index: {
    title: SITE_NAME,
    description:
      "A curated collection of links to Steve Hsu (什五)'s artworks, software projects, social media, and more. Find all of Steve Hsu (什五)'s online presence in one place.",
    pagePath: "/",
    robots: "index, follow",
    jsonLDType: "homepage",
    tier: "full",
    changefreq: "weekly",
    priority: 1.0,
  },
  about: {
    title: `About - ${SITE_NAME}`,
    description:
      "Learn more about Steve Hsu (什五) - an artist, developer, and creator. Find contact information, emails, and ways to get in touch.",
    pagePath: "/about.html",
    robots: "index, follow",
    jsonLDType: "breadcrumb",
    jsonLDPageName: "About",
    tier: "full",
    changefreq: "monthly",
    priority: 0.8,
  },
  "artworks-and-videos": {
    title: `Artworks & Videos - ${SITE_NAME}`,
    description:
      "Explore Steve Hsu (什五)'s artworks and video creations. Links to Pixiv, art portfolios, video channels, and creative projects.",
    pagePath: "/artworks-and-videos.html",
    robots: "index, follow",
    jsonLDType: "breadcrumb",
    jsonLDPageName: "Artworks & Videos",
    tier: "full",
    changefreq: "monthly",
    priority: 0.8,
  },
  "blogs-and-sponsor": {
    title: `Blogs & Sponsor - ${SITE_NAME}`,
    description:
      "Read Steve Hsu (什五)'s blog posts and discover ways to support his work through sponsorship and donations.",
    pagePath: "/blogs-and-sponsor.html",
    robots: "index, follow",
    jsonLDType: "breadcrumb",
    jsonLDPageName: "Blogs & Sponsor",
    tier: "full",
    changefreq: "monthly",
    priority: 0.7,
  },
  chatting: {
    title: `Chatting - ${SITE_NAME}`,
    description:
      "Join Steve Hsu (什五)'s community on QQ, Discord, and other social platforms. Connect and chat with like-minded people.",
    pagePath: "/chatting.html",
    robots: "index, follow",
    jsonLDType: "breadcrumb",
    jsonLDPageName: "Chatting",
    tier: "full",
    changefreq: "monthly",
    priority: 0.7,
  },
  softwares: {
    title: `Softwares - ${SITE_NAME}`,
    description:
      "Discover software projects by Steve Hsu (什五), including the Quanto Series and other development tools and utilities.",
    pagePath: "/softwares.html",
    robots: "index, follow",
    jsonLDType: "breadcrumb",
    jsonLDPageName: "Softwares",
    tier: "full",
    changefreq: "monthly",
    priority: 0.7,
  },
};
