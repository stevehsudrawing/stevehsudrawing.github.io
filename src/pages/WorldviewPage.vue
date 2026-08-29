<!--
  WorldviewPage.vue — Internationalized worldview / character-settings page.
  Renders the per-language worldview.md (selected reactively by
  useMarkdownContent) via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";
import { useMarkdownContent } from "../composables/useMarkdownContent";

// =========================================================================
// Markdown content (per-language raw import, reactive to language)
// =========================================================================

const { content } = useMarkdownContent("worldview");
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-worldview')"
    :description="$t('text-worldview-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/worldview.avif' } },
        webp: { light: { en: '/images/webp/covers/worldview.webp' } },
      },
      alt: $t('text-worldview-alt'),
      class: 'rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="worldview" />

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle
    :content="content"
    page-path="/worldview.html"
    class="no-copy"
  />
</template>
