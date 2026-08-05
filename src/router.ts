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

/** Vue Router instance with web history (one per MPA entry point). */
export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      // Return a promise to wait for async-rendered content (link cards,
      // button groups) to mount before attempting the hash scroll.
      // If the element never appears, fall back to top of page.
      return new Promise((resolve) => {
        let attempts = 0;
        const check = (): void => {
          if (document.querySelector(to.hash)) {
            resolve({ el: to.hash, behavior: "smooth" as const });
          } else if (++attempts < 20) {
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
