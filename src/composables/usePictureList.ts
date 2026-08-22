/**
 * Picture list composable — loads the picture-list JSON config for the
 * current page (currently only the Gallery page).
 */
import { computed, ref, type Ref } from "vue";
import type { DisplayPictureGroupData } from "../types/app";

// =========================================================================
// Constants
// =========================================================================

/** Map of page names to their picture-list JSON module loaders. */
const configLoaders: Record<string, () => Promise<{ default: unknown }>> = {
  gallery: () => import("../configs/picture-list/gallery.json"),
};

// =========================================================================
// Composable
// =========================================================================

/**
 * Load picture-list data for a given page name.
 *
 * @param pageName - A ref to the page name without .html extension
 *   (e.g. "gallery").
 * @returns Reactive refs for groups and page path.
 */
export function usePictureList(pageName: Ref<string>): {
  groups: Ref<DisplayPictureGroupData[] | null>;
  pagePath: Ref<string>;
} {
  const groups = ref<DisplayPictureGroupData[] | null>(null);

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
    // JSON imports widen string literal types (e.g. feature: ["follow-language"]
    // becomes string[]) — cast to the strict runtime shape.
    groups.value = mod.default as DisplayPictureGroupData[];
  }

  // Load immediately
  void load();

  return { groups, pagePath };
}
