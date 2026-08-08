/**
 * Link cards composable — loads the link-card JSON config for the current page.
 */
import { ref, computed, type Ref } from "vue";
import type { GroupData } from "../types/app";

// =========================================================================
// Constants
// =========================================================================

/** Canonical base URL of the deployed site (for copy-link generation). */
export const BASE_URL = "https://stevehsudrawing.github.io";

/** Map of page names to their link-card JSON module loaders. */
const configLoaders: Record<string, () => Promise<{ default: GroupData[] }>> = {
  about: () => import("../configs/link-cards/about.json"),
  "artworks-and-videos": () =>
    import("../configs/link-cards/artworks-and-videos.json"),
  "blogs-and-sponsor": () =>
    import("../configs/link-cards/blogs-and-sponsor.json"),
  chatting: () => import("../configs/link-cards/chatting.json"),
  softwares: () => import("../configs/link-cards/softwares.json"),
};

// =========================================================================
// Composable
// =========================================================================

/**
 * Load link-card data for a given page name.
 *
 * @param pageName - A ref to the page name without .html extension (e.g. "about").
 * @returns Reactive refs for groups and page path.
 */
export function useLinkCards(pageName: Ref<string>): {
  groups: Ref<GroupData[] | null>;
  pagePath: Ref<string>;
} {
  const groups = ref<GroupData[] | null>(null);

  const pagePath = computed(() => {
    const name = pageName.value;
    return name === "index" ? "/" : `/${name}.html`;
  });

  async function load(): Promise<void> {
    const loader = configLoaders[pageName.value];
    if (!loader) {
      groups.value = null;
      return;
    }
    const mod = await loader();
    groups.value = mod.default;
  }

  // Load immediately
  void load();

  return { groups, pagePath };
}
