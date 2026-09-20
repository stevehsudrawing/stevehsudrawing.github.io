<!--
  GalleryPage.vue — Gallery page hero section + picture groups.
  Renders every group whose `pages` includes `gallery` (sticker posters +
  the carousel illustrations); the lightbox URL flow (`?picGroupId=` /
  `?picId=`) is owned by `usePictureViewerUrl()` (installed in App.vue), so
  a card click only delegates to the group-viewer opener.
-->
<script setup lang="ts">
import { computed } from "vue";
import PictureListGroups from "../components/cards/PictureListGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { usePictureGroupViewerModal } from "../composables/usePictureGroupViewerModal";
import { usePictureList } from "../composables/usePictureList";
import { usePictureRegistry } from "../composables/usePictureRegistry";

// =========================================================================
// Picture groups
// =========================================================================

const { groupsForPage, pagePath } = usePictureList();
const groups = computed(() => groupsForPage("gallery"));

// =========================================================================
// Lightbox
// =========================================================================

const { pictureProps } = usePictureRegistry();
const { openPictureGroupViewerModal } = usePictureGroupViewerModal();

/**
 * Card click — open the group viewer at the clicked picture.
 *
 * @param pictureId - Clicked picture id.
 * @param groupId - Owning group id (carried by the select chain).
 */
function onSelect(pictureId: string, groupId: string): void {
  openPictureGroupViewerModal({ picGroupId: groupId, picId: pictureId });
}
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-gallery')"
    :description="$t('text-gallery-description')"
    :image="
      pictureProps('artworks', {
        showAltButton: true,
        previewable: true,
        class: 'solid-bg',
      })
    "
  />

  <PageChainNav page-name="gallery" />

  <hr />

  <!-- ==== Picture groups ==== -->
  <div v-if="groups.length" class="container">
    <PictureListGroups
      :groups="groups"
      :page-path="pagePath"
      @select="onSelect"
    />
  </div>
</template>
