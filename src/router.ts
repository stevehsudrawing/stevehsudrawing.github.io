/**
 * Vue Router configuration.
 *
 * Phase 7: replaces page-transition.ts with Vue Router for SPA-style
 * internal navigation while preserving MPA build structure for SEO.
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
  scrollBehavior(to) {
    if (to.hash) {
      // Poll for async-rendered content (link cards, button groups)
      // to mount before scrolling.  If the element never appears,
      // fall back to top of page.
      return new Promise((resolve) => {
        let attempts = 0;
        const check = (): void => {
          const el = document.querySelector(to.hash);
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
// Error handling
// =========================================================================

/**
 * Fall back to a full browser navigation if a lazy-loaded page chunk
 * fails to load (e.g. network error, stale cache after deployment).
 * Mirrors the old page-transition.ts fetch-failure fallback.
 */
router.onError((error) => {
  if (
    /Failed to fetch dynamically imported module|Importing a module script failed/.test(
      error.message,
    )
  ) {
    window.location.assign(window.location.href);
  }
});
