<!--
  CopyrightPage.vue — Copyright notice for original artworks.
  Renders the markdown content from public/images/README.md
  via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import HeroSection from "../components/ui/HeroSection.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";

// =========================================================================
// Markdown content (build-time raw import)
// =========================================================================

import copyrightMd from "../../public/images/README.md?raw";
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="
      $t(
        'text-copyright-notice-title',
        'Copyright Notice for Original Artworks',
      )
    "
    :description="
      $t(
        'text-copyright-notice-description',
        'Copyright notice and usage terms for original artworks by Steve Hsu (什五).',
      )
    "
    :image="{
      avifSrcLight: '/images/avif/covers/about.avif',
      fallbackSrcLight: '/images/webp/covers/about.webp',
      alt: $t('text-artworks', 'Artworks'),
      imgClass: 'img-fluid img-fit rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="copyright-notice" />

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle :content="copyrightMd" />
</template>
