/**
 * usePictureGroupViewerModal — group-lightbox controller.
 *
 * Mirrors `usePictureViewerModal()`: resolves the group from the pool, pushes
 * the group viewer (`PictureGroupViewerModal`, stack id
 * `picture-group-viewer`) and writes the entry parameters
 * (`?picGroupId=` + `?picId=`).  Afterwards `usePictureViewerUrl()`
 * (installed in App.vue) keeps the params in step with the stack.
 *
 * `picId` wins over `picIndex`; an index is resolved to an id **before**
 * pushing, so the stack only ever carries ids and an index never reaches
 * the URL.  Unknown ids warn and do not open; an out-of-range index is
 * clamped.
 *
 * @example
 * const { openPictureGroupViewerModal } = usePictureGroupViewerModal();
 * openPictureGroupViewerModal({ picGroupId: "sticker-collections", picId: "…" });
 */

import { useRoute, useRouter } from "vue-router";
import { preserveLangParam } from "../core/utils";
import { useModalStack } from "./useModalStack";
import { usePictureList } from "./usePictureList";

// =========================================================================
// Types
// =========================================================================

/** Options for `openPictureGroupViewerModal()`. */
export interface OpenPictureGroupViewerModalOptions {
  /** Group id (pool key) — the `?picGroupId=` value. */
  picGroupId: string;
  /** Picture id to open — wins over `picIndex`. */
  picId?: string;
  /** Zero-based position inside the group (resolved to an id). */
  picIndex?: number;
}

// =========================================================================
// Composable
// =========================================================================

/**
 * Group-viewer controller.
 *
 * @returns `openPictureGroupViewerModal(options)` — pushes the group viewer
 *   with the group's picture ids and mirrors the entry params into the
 *   URL.
 */
export function usePictureGroupViewerModal(): {
  /** Push the group viewer at the requested picture. */
  openPictureGroupViewerModal: (
    options: OpenPictureGroupViewerModalOptions,
  ) => void;
} {
  const { push } = useModalStack();
  const { findGroup } = usePictureList();
  const route = useRoute();
  const router = useRouter();

  /**
   * Resolve the picture to show: `picId` → `picIndex` → the first one.
   *
   * @param contents - Picture ids of the group.
   * @param picId - Requested picture id.
   * @param picIndex - Requested position.
   * @returns The resolved id, or `null` when the request is invalid.
   */
  function resolveTargetId(
    contents: string[],
    picId?: string,
    picIndex?: number,
  ): string | null {
    if (picId !== undefined) {
      if (contents.includes(picId)) return picId;
      if (import.meta.env.DEV) {
        console.warn(
          `[picture-group-viewer] picture "${picId}" is not in this group`,
        );
      }
      return null;
    }
    if (picIndex !== undefined) {
      const clamped = Math.min(
        Math.max(Math.trunc(picIndex), 0),
        contents.length - 1,
      );
      if (clamped !== picIndex && import.meta.env.DEV) {
        console.warn(
          `[picture-group-viewer] picIndex ${picIndex} is out of range — clamped to ${clamped}`,
        );
      }
      return contents[clamped] ?? null;
    }
    return contents[0] ?? null;
  }

  function openPictureGroupViewerModal(
    options: OpenPictureGroupViewerModalOptions,
  ): void {
    const { picGroupId, picId, picIndex } = options;
    const group = findGroup(picGroupId);
    if (!group || group.contents.length === 0) {
      if (import.meta.env.DEV) {
        console.warn(
          `[picture-group-viewer] unknown or empty group: "${picGroupId}"`,
        );
      }
      return;
    }
    const currentId = resolveTargetId(group.contents, picId, picIndex);
    if (!currentId) return;

    push({
      id: "picture-group-viewer",
      props: { groupId: picGroupId, contents: group.contents, currentId },
    });
    router.push({
      query: preserveLangParam({
        ...route.query,
        picGroupId,
        picId: currentId,
      }),
    });
  }

  return { openPictureGroupViewerModal };
}
