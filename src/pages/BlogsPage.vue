<!--
  BlogsPage.vue — Blogs & Sponsor page hero section + link cards.
  Previously static content in blogs-and-sponsor.html.
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

const { groups, pagePath } = useLinkCards(ref("blogs-and-sponsor"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-blogs-and-sponsor')"
    :description="$t('text-blogs-and-sponsor-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/blogs.avif' } },
        webp: { light: { en: '/images/webp/covers/blogs.webp' } },
      },
      alt: $t('text-blogs-and-sponsor'),
      class: 'rounded',
    }"
  />

  <PageChainNav page-name="blogs-and-sponsor" />

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
