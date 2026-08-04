/**
 * Vue Router configuration.
 *
 * Phase 7: replaces page-transition.ts with Vue Router for SPA-style
 * internal navigation while preserving MPA build structure for SEO.
 *
 * Uses createMemoryHistory so each MPA entry point initializes its own
 * router instance — no shared state across page reloads.
 */
import { createRouter, createMemoryHistory } from "vue-router";

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

/** Vue Router instance with memory history (one per MPA entry point). */
export const router = createRouter({
  history: createMemoryHistory(),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" as const };
    }
    return { top: 0 };
  },
});
