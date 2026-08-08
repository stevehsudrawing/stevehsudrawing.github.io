<!--
  ArtworksPage.vue — Artworks & Videos page hero section + link cards.
  Previously static content in artworks-and-videos.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("artworks-and-videos"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-artworks-and-videos', 'Artworks &amp; Videos')"
    :description="
      $t(
        'text-artworks-and-videos-description',
        'Welcome to view my personal artworks and videos through other platforms!',
      )
    "
    :image="{
      avifSrcLight: '/images/avif/covers/artworks-light.avif',
      avifSrcDark: '/images/avif/covers/artworks-dark.avif',
      fallbackSrcLight: '/images/webp/covers/artworks-light.webp',
      fallbackSrcDark: '/images/webp/covers/artworks-dark.webp',
      feature: 'follow-theme',
      alt: $t('text-artworks', 'Artworks'),
      imgClass: 'img-fluid img-fit rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="artworks-and-videos" />

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups
      :groups="groups"
      :page-path="pagePath"
      :base-url="BASE_URL"
    />
  </div>
</template>
