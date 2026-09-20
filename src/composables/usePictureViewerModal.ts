/**
 * usePictureViewerModal — single-image lightbox controller.
 *
 * Pushes the single-image viewer (`PictureViewerModal`, stack id
 * `picture-viewer`) onto the shared modal stack with a set of
 * `FeatureAwarePictureProps`, and writes the entry parameter
 * `?picId=<pictureId>` when the props carry a registry id — so the hero /
 * carousel preview buttons become shareable and Back-consistent.  The
 * URL owner (`usePictureViewerUrl()`) strips the parameter again when the
 * viewer closes.
 *
 * The picture's whole metadata travels in the props object (`alt` /
 * `title` / `message` / `relatedLink`) — there is no second parameter;
 * the viewer falls back to `t("text-image-preview")` when the picture
 * carries no title.
 *
 * @example
 * const { openPictureViewerModal } = usePictureViewerModal();
 * openPictureViewerModal(props);
 */

import { useRoute, useRouter } from "vue-router";
import { preserveLangParam } from "../core/utils";
import type { FeatureAwarePictureProps } from "../types/app";
import { useModalStack } from "./useModalStack";

// =========================================================================
// Composable
// =========================================================================

/**
 * Single-image viewer controller.
 *
 * @returns `openPictureViewerModal(img)` — pushes the lightbox with the
 *   given display props and mirrors the picture id into the URL.
 */
export function usePictureViewerModal(): {
  /** Push the single-image viewer with the given display props. */
  openPictureViewerModal: (img: FeatureAwarePictureProps) => void;
} {
  const { push } = useModalStack();
  const route = useRoute();
  const router = useRouter();

  function openPictureViewerModal(img: FeatureAwarePictureProps): void {
    push({ id: "picture-viewer", props: { img } });
    if (!img.pictureId) return;
    // Entry param only — the single viewer never navigates internally.
    router.push({
      query: preserveLangParam({
        ...route.query,
        picGroupId: undefined,
        picId: img.pictureId,
      }),
    });
  }

  return { openPictureViewerModal };
}
