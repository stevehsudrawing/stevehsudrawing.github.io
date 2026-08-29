<!--
  CopyrightPage.vue — Copyright notice for original artworks.
  Renders the markdown content from public/images/README.md
  via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";

// =========================================================================
// Markdown content (build-time raw import)
// =========================================================================

import copyrightMd from "../../public/images/README.md?raw";
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-copyright-notice-title')"
    :description="$t('text-copyright-notice-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/about.avif' } },
        webp: { light: { en: '/images/webp/covers/about.webp' } },
      },
      alt: $t('text-about-alt'),
      class: 'rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="copyright-notice" />

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle :content="copyrightMd" page-path="/copyright-notice.html" />
</template>
