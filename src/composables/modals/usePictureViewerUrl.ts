/**
 * usePictureViewerUrl — the single owner of the lightbox query params.
 *
 * Installed once in `App.vue`.  It keeps `?picGroupId=` / `?picId=` in
 * step with the modal stack in both directions:
 *
 *   route → stack   `?picGroupId=` (with `?picId=` or alone) opens the
 *                   group viewer; a bare `?picId=` opens the single-image
 *                   viewer on ANY page — or re-stacks it on the group
 *                   when the group is open (the nested state); unknown
 *                   ids warn and open nothing
 *   stack → route   once no lightbox is open the params are stripped
 *                   (keeping `?lang=`); closing a nested single viewer
 *                   restores the group params
 *
 * The openers (`usePictureGroupViewerModal`, `usePictureViewerModal`) write the
 * entry params themselves; this composable only reacts, so every
 * transition has exactly one writer.
 */

import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { preserveLangParam } from "../../core/utils";
import type { ModalStackItem } from "../../types/app";
import { usePictureList } from "../pictures/usePictureList";
import { usePictureRegistry } from "../pictures/usePictureRegistry";
import { useModalStack } from "./useModalStack";

// =========================================================================
// Composable
// =========================================================================

/**
 * Keep the lightbox query params and the modal stack in sync.
 *
 * @returns Nothing — install it once and it runs for the app's lifetime.
 */
export function usePictureViewerUrl(): void {
  const route = useRoute();
  const router = useRouter();
  const { push, pop, stack } = useModalStack();
  const { groups, findGroup } = usePictureList();
  const { pictureProps, hasPicture } = usePictureRegistry();

  /** Whether the group viewer is currently in the stack (open). */
  const groupViewerOpen = computed(() =>
    stack.value.some((item) => item.id === "picture-group-viewer"),
  );

  /** Whether the single-image viewer is currently in the stack (open). */
  const singleViewerOpen = computed(() =>
    stack.value.some((item) => item.id === "picture-viewer"),
  );

  /**
   * Read one query param.
   *
   * @param value - Raw `route.query` value.
   * @returns The non-empty string, or `null`.
   */
  function queryValue(value: unknown): string | null {
    return typeof value === "string" && value ? value : null;
  }

  /** Remove both lightbox params, keeping everything else (`?lang=`). */
  function stripViewerParams(): void {
    if (!route.query.picId && !route.query.picGroupId) return;
    const query = { ...route.query };
    delete query.picId;
    delete query.picGroupId;
    router.replace({ query: preserveLangParam(query) });
  }

  /**
   * Open the group viewer from a deep link.
   *
   * @param groupId - `?picGroupId=` value.
   * @param pictureId - `?picId=` value (null = the group's first picture).
   */
  function openGroupFromUrl(groupId: string, pictureId: string | null): void {
    const group = findGroup(groupId);
    if (!group || group.contents.length === 0) {
      console.warn(`[picture-viewer-url] unknown or empty group: "${groupId}"`);
      return;
    }
    const currentId = pictureId ?? group.contents[0];
    if (!group.contents.includes(currentId)) {
      console.warn(
        `[picture-viewer-url] picture "${currentId}" is not in group "${groupId}"`,
      );
      return;
    }
    push({
      id: "picture-group-viewer",
      props: { groupId, contents: group.contents, currentId },
    });
  }

  // ---- route → stack (deep links) ----
  //
  // Deep links resolve only after the router's initial navigation has
  // settled: App.vue dismisses the viewers on a PATH change, and the first
  // navigation (query + path together) would otherwise close the viewer
  // this watcher had just opened.
  const routerReady = ref(false);
  void router.isReady().then(() => {
    routerReady.value = true;
  });

  watch(
    [
      () => route.query.picId,
      () => route.query.picGroupId,
      groups,
      routerReady,
    ],
    () => {
      if (!routerReady.value) return;
      const pictureId = queryValue(route.query.picId);
      const groupId = queryValue(route.query.picGroupId);
      const groupOpen = groupViewerOpen.value;
      const singleOpen = singleViewerOpen.value;

      // ---- nested stack (single viewer on top of the group) ----
      if (groupOpen && singleOpen) {
        if (!pictureId && !groupId) {
          // Both params gone — a history jump past both entries: close
          // both viewers, top down.
          while (
            (groupViewerOpen.value || singleViewerOpen.value) &&
            stack.value.length
          ) {
            pop();
          }
        } else if (groupId) {
          // The URL describes the group BENEATH — close the single
          // viewer (a Back press from its bare `?picId=` entry).
          pop();
        }
        return;
      }

      if (groupOpen) {
        if (!pictureId && !groupId) {
          // Removing the params while a lightbox is open closes it
          // (Close button / Back).  Leaving the page is handled by
          // App.vue.
          pop();
          return;
        }
        if (pictureId && !groupId) {
          // A bare `?picId=` while the group is open — the nested
          // single viewer is being re-opened from the URL (Forward).
          push({
            id: "picture-viewer",
            props: { img: pictureProps(pictureId) },
          });
        }
        return;
      }

      if (singleOpen) {
        // Removing the params while a lightbox is open closes it.
        if (!pictureId && !groupId) pop();
        return;
      }
      if (!pictureId && !groupId) return;

      if (groupId) {
        openGroupFromUrl(groupId, pictureId);
        return;
      }
      if (pictureId && hasPicture(pictureId)) {
        push({ id: "picture-viewer", props: { img: pictureProps(pictureId) } });
      }
    },
    { immediate: true },
  );

  // ---- stack → route (cleanup / nested restore) ----
  watch(
    [groupViewerOpen, singleViewerOpen],
    ([group, single], [, wasSingle]) => {
      if (!group && !single) {
        stripViewerParams();
        return;
      }
      // The nested single viewer just closed while its group stayed
      // open: restore the group entry params (the single's bare
      // `?picId=` is still in the URL; nothing to do when a Back
      // navigation already brought the group params back).
      if (
        wasSingle &&
        !single &&
        group &&
        !queryValue(route.query.picGroupId)
      ) {
        const item = stack.value.find(
          (
            entry,
          ): entry is Extract<ModalStackItem, { id: "picture-group-viewer" }> =>
            entry.id === "picture-group-viewer",
        );
        if (item) {
          router.replace({
            query: preserveLangParam({
              ...route.query,
              picGroupId: item.props.groupId,
              picId: queryValue(route.query.picId) ?? item.props.currentId,
            }),
          });
        }
      }
    },
  );
}
