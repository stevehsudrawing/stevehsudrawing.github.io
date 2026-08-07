/**
 * Link button groups composable — loads the link-button-group JSON config
 * for a given page.
 *
 * Phase 7: replaces build-time data-role="link-button-group" injection in
 * content-injection-plugin.ts.
 */
import { ref, type Ref } from "vue";
import type { LinkButtonGroupData } from "../types/app";

// =========================================================================
// Constants
// =========================================================================

/** Map of page names to their link-button-group JSON module loaders. */
const configLoaders: Record<
  string,
  () => Promise<{ default: LinkButtonGroupData[] }>
> = {
  index: () => import("../configs/link-button-groups/index.json"),
};

// =========================================================================
// Composable
// =========================================================================

/**
 * Load link-button-group data for a given page name.
 *
 * @param pageName - A ref to the page name (e.g. "index").
 * @returns Reactive ref of all button groups for this page, or null if none.
 */
export function useLinkButtonGroups(pageName: Ref<string>): {
  groups: Ref<LinkButtonGroupData[] | null>;
} {
  const groups = ref<LinkButtonGroupData[] | null>(null);

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

  return { groups };
}
