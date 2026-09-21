/**
 * Picture list composable — the group pool.
 *
 * `src/configs/picture-groups.json` is the single pool: each group lists
 * picture ids (resolved through the registry) and the pages that render
 * it (`pages`).  Group ids and picture ids therefore share one global
 * space, which is what lets the lightboxes be addressed from any page.
 *
 * The pool is imported lazily and loaded once per session (module-level
 * singleton), so pages without pictures never pay for it.
 */
import { computed, ref, type Ref } from "vue";
import { useRoute } from "vue-router";
import registryData from "../../configs/picture-registry.json";
import { findPictureEntry } from "../../core/picture-registry";
import type {
  DisplayPictureGroupData,
  RegistryPictureEntry,
} from "../../types/app";

// =========================================================================
// Pool loading (module-level singleton)
// =========================================================================

/** The registry array, used to validate the pool's picture ids. */
const registry = registryData as RegistryPictureEntry[];

/** Loaded pool (null until the lazy import resolves). */
const groups = ref<DisplayPictureGroupData[] | null>(null);

/** In-flight / resolved loader promise (shared by every caller). */
let poolPromise: Promise<DisplayPictureGroupData[]> | null = null;

/**
 * Dev-only: report pool entries that reference an unknown picture id.
 *
 * @param pool - The loaded pool.
 */
function warnAboutUnknownPictures(pool: DisplayPictureGroupData[]): void {
  for (const group of pool) {
    for (const id of group.contents ?? []) {
      if (!findPictureEntry(registry, id)) {
        console.warn(
          `[picture-groups] group "${group.id}" references an unknown picture id: "${id}"`,
        );
      }
    }
  }
}

/**
 * Load (once) and validate the group pool.
 *
 * @returns The pool in config order.
 */
function loadPool(): Promise<DisplayPictureGroupData[]> {
  if (!poolPromise) {
    poolPromise = import("../../configs/picture-groups.json").then((mod) => {
      const pool = mod.default as unknown as DisplayPictureGroupData[];
      if (import.meta.env.DEV) warnAboutUnknownPictures(pool);
      return pool;
    });
  }
  return poolPromise;
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Access the group pool.
 *
 * @returns `groups` (the whole pool, `null` while loading), `pagePath`
 *   (the current route, for anchor / copy links), `findGroup(id)` and
 *   `groupsForPage(pageName)` (the `pages` filter shared with the build).
 */
export function usePictureList(): {
  groups: Ref<DisplayPictureGroupData[] | null>;
  pagePath: Ref<string>;
  findGroup: (groupId: string) => DisplayPictureGroupData | null;
  groupsForPage: (pageName: string) => DisplayPictureGroupData[];
} {
  const route = useRoute();

  /** Current page path for anchor/copy-link URLs (index page = "/"). */
  const pagePath = computed(() => {
    const path = route.path;
    return path === "/index.html" || path === "/" ? "/" : path;
  });

  function findGroup(groupId: string): DisplayPictureGroupData | null {
    return groups.value?.find((group) => group.id === groupId) ?? null;
  }

  function groupsForPage(pageName: string): DisplayPictureGroupData[] {
    return (groups.value ?? []).filter((group) =>
      (group.pages ?? []).includes(pageName),
    );
  }

  // Load immediately (no-op when the pool is already resolved).
  void loadPool().then((pool) => {
    groups.value = pool;
  });

  return { groups, pagePath, findGroup, groupsForPage };
}
