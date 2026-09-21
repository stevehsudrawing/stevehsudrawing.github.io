<!--
  CopyrightPage.vue — Copyright notice for original artworks.
  Renders the markdown content from public/images/README.md
  via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";
import { usePictureRegistry } from "../composables/pictures/usePictureRegistry";

// Picture registry — resolves the hero cover props.
const { pictureProps } = usePictureRegistry();

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
    :image="
      pictureProps('illustration-1', {
        showAltButton: true,
        previewable: true,
        class: 'solid-bg',
        relatedLink: { noQRCode: true },
      })
    "
  />

  <PageChainNav page-name="copyright-notice" />

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle :content="copyrightMd" page-path="/copyright-notice.html" />
</template>
