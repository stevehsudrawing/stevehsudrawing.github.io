<!--
  ArtworksPage.vue — Artworks & Videos page hero section + link cards.
  Previously static content in artworks-and-videos.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useLinkCards } from "../composables/content/useLinkCards";
import { usePictureRegistry } from "../composables/pictures/usePictureRegistry";

// Picture registry — resolves the hero cover props.
const { pictureProps } = usePictureRegistry();

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("artworks-and-videos"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-artworks-and-videos')"
    :description="$t('text-artworks-and-videos-description')"
    :image="
      pictureProps('artworks', {
        showAltButton: true,
        previewable: true,
        class: 'solid-bg',
      })
    "
  />

  <PageChainNav page-name="artworks-and-videos" />

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
