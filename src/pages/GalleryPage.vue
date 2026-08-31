<!--
  GalleryPage.vue — Gallery page hero section + picture groups + lightbox.
  Coordinates the ?preview=<id> deep link and thumbnail clicks with the
  shared modal stack (PictureViewerModal).
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PictureListGroups from "../components/cards/PictureListGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useModalStack } from "../composables/useModalStack";
import { usePictureList } from "../composables/usePictureList";
import { preserveLangParam } from "../core/utils";
import type { DisplayPictureData, DisplayPictureGroupData } from "../types/app";

// =========================================================================
// Picture groups
// =========================================================================

const { groups, pagePath } = usePictureList(ref("gallery"));

// =========================================================================
// Lightbox coordination (modal stack + ?preview= deep link)
// =========================================================================

const route = useRoute();
const router = useRouter();
const { push, pop, clear, stack } = useModalStack();

/** Whether the picture viewer is currently in the stack (open). */
const viewerOpen = computed(() =>
  stack.value.some((item) => item.id === "picture-viewer"),
);

/** Find the group + picture for a picture id. */
function findPicture(
  id: string,
): { group: DisplayPictureGroupData; picture: DisplayPictureData } | null {
  if (!groups.value) return null;
  const group = groups.value.find((g) => g.contents.some((c) => c.id === id));
  const picture = group?.contents.find((c) => c.id === id);
  if (!group || !picture) return null;
  return { group, picture };
}

/** Push the picture viewer onto the modal stack. */
function openViewer(
  picture: DisplayPictureData,
  contents: DisplayPictureData[],
): void {
  push({
    id: "picture-viewer",
    props: { contents, currentId: picture.id },
  });
}

/** Remove the ?preview= query param (keeping ?lang=). */
function stripPreview(): void {
  if (!route.query.preview) return;
  const query = { ...route.query };
  delete query.preview;
  router.replace({ query: preserveLangParam(query) });
}

// ---- Viewer closed -> clean the deep link from the URL ----

watch(viewerOpen, (open) => {
  if (!open) stripPreview();
});

// ---- Leaving the gallery page ----
// GalleryPage unmounts when the route changes away (related link, Back to
// another page); dismiss any leftover overlay so it never stays over the
// destination page.

onBeforeUnmount(() => {
  if (viewerOpen.value) clear();
});

// ---- Route-driven open/close ----
// ?preview=<id> opens the viewer once data is ready; removing ?preview=
// while it is open (Close button / Back) pops it.  Opening is ignored
// while the viewer is already open (thumbnails / prev / next manage it).

watch(
  [() => route.query.preview, groups],
  ([preview, g]) => {
    const id = typeof preview === "string" ? preview : null;
    if (viewerOpen.value) {
      if (!id) pop();
      return;
    }
    if (!id || !g) return;
    const found = findPicture(id);
    if (found) openViewer(found.picture, found.group.contents);
  },
  { immediate: true },
);

// ---- Thumbnail click ----

function onSelect(picture: DisplayPictureData): void {
  const found = findPicture(picture.id);
  if (!found || viewerOpen.value) return;
  // Open first, then push a history entry (so Back / the Close button can
  // return to the plain gallery page) — the route watch ignores changes
  // while the viewer is open.
  openViewer(found.picture, found.group.contents);
  router.push({
    query: preserveLangParam({ ...route.query, preview: picture.id }),
  });
}
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-gallery')"
    :description="$t('text-gallery-description')"
    :image="{
      srcMap: {
        avif: {
          light: { en: '/images/avif/covers/artworks-light.avif' },
          dark: { en: '/images/avif/covers/artworks-dark.avif' },
        },
        webp: {
          light: { en: '/images/webp/covers/artworks-light.webp' },
          dark: { en: '/images/webp/covers/artworks-dark.webp' },
        },
      },
      feature: ['follow-theme'],
      alt: $t('text-artworks-alt'),
      class: 'no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="gallery" />

  <hr />

  <!-- ==== Picture groups ==== -->
  <div v-if="groups" class="container">
    <PictureListGroups
      :groups="groups"
      :page-path="pagePath"
      @select="onSelect"
    />
  </div>
</template>
