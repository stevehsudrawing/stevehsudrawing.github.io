<!--
  ArtworksPage.vue — Artworks & Videos page hero section + link cards.
  Previously static content in artworks-and-videos.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useLinkCards } from "../composables/useLinkCards";

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
      class: 'rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="artworks-and-videos" />

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
