/**
 * Vue Router configuration.
 *
 * Uses createWebHistory so the URL bar updates on navigation and
 * browser back/forward buttons work correctly.  Each MPA entry point
 * still initializes its own router instance — no state is shared
 * across full-page reloads.
 */

import { createRouter, createWebHistory } from "vue-router";

// =========================================================================
// Routes
// =========================================================================

const routes = [
  {
    path: "/",
    alias: "/index.html",
    component: () => import("./pages/IndexPage.vue"),
  },
  {
    path: "/about.html",
    component: () => import("./pages/AboutPage.vue"),
  },
  {
    path: "/artworks-and-videos.html",
    component: () => import("./pages/ArtworksPage.vue"),
  },
  {
    path: "/gallery.html",
    component: () => import("./pages/GalleryPage.vue"),
  },
  {
    path: "/blogs-and-sponsor.html",
    component: () => import("./pages/BlogsPage.vue"),
  },
  {
    path: "/chatting.html",
    component: () => import("./pages/ChattingPage.vue"),
  },
  {
    path: "/softwares.html",
    component: () => import("./pages/SoftwaresPage.vue"),
  },
  {
    path: "/copyright-notice.html",
    component: () => import("./pages/CopyrightPage.vue"),
  },
  {
    path: "/worldview.html",
    component: () => import("./pages/WorldviewPage.vue"),
  },
];

// =========================================================================
// Router instance
// =========================================================================
// Constants
// =========================================================================

/** Fixed navbar height used as scroll offset for hash targets. */
const NAVBAR_OFFSET = 64;

/** Max rAF polling attempts for async-rendered hash targets (~1 s at 60 fps). */
const MAX_HASH_POLL_ATTEMPTS = 60;

// =========================================================================

/** Vue Router instance with web history (one per MPA entry point). */
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Back / forward (popstate): restore the saved scroll position so
    // returning to a page keeps where the user left off.  The restored
    // offset is only applied once the page is tall enough — async content
    // (link cards, GitHub cards) mounts after the navigation, and an early
    // restore would be clamped to the top.
    if (savedPosition) {
      return new Promise((resolve) => {
        const target = savedPosition.top ?? 0;
        let attempts = 0;
        const check = (): void => {
          const maxScroll =
            Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight,
            ) - window.innerHeight;
          if (maxScroll >= target || ++attempts >= MAX_HASH_POLL_ATTEMPTS) {
            resolve(savedPosition);
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
    }
    if (to.path === from.path && !to.hash) {
      // Same-page query-only navigation: preserve scroll for in-place
      // language switches (?lang=) and the lightbox (?preview= open /
      // prev / next / close).  Other same-page link clicks fall through
      // and scroll to top (pre-v3.9.1 behavior).
      if (
        to.query.preview !== from.query.preview ||
        to.query.lang !== from.query.lang
      ) {
        return false;
      }
    }
    if (to.hash) {
      // Poll for async-rendered content (link cards, button groups)
      // to mount before scrolling.  If the element never appears,
      // fall back to top of page.
      return new Promise((resolve) => {
        let attempts = 0;
        const check = (): void => {
          // getElementById (not querySelector) — digit-leading hashes
          // (e.g. "#47c4ee") are invalid CSS selectors and would throw.
          const el = document.getElementById(to.hash.slice(1));
          if (el) {
            // Manually compute scroll position so the 64 px fixed
            // navbar does not cover the target heading.
            const top =
              el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
            resolve({ top: Math.max(0, top), behavior: "smooth" as const });
          } else if (++attempts < MAX_HASH_POLL_ATTEMPTS) {
            requestAnimationFrame(check);
          } else {
            resolve({ top: 0 });
          }
        };
        check();
      });
    }
    return { top: 0 };
  },
});

// =========================================================================
// 404 guard
// =========================================================================

/**
 * Redirect to the static 404 page when no route matches the requested path.
 * 404.html is not a Vue route — we use a full-page navigation to the static
 * file that GitHub Pages also serves for genuine HTTP 404s.
 */
router.beforeEach((to) => {
  if (to.matched.length === 0) {
    window.location.assign("/404.html");
    return false;
  }
});

// =========================================================================
// Error handling
// =========================================================================

/**
 * Fall back to a full browser navigation if a lazy-loaded page chunk
 * fails to load (e.g. network error, stale cache after deployment).
 * Mirrors the old page-transition.ts fetch-failure fallback.
 */
router.onError((error) => {
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed|Failed to load resource|Security Error/.test(
      error.message,
    )
  ) {
    window.location.assign(window.location.href);
  }
});
