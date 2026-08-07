<!--
  BlogsPage.vue -- Blogs & Sponsor page hero section + link cards.
  Previously static content in blogs-and-sponsor.html.

  Phase 7: replaces static HTML content.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("blogs-and-sponsor"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-blogs-and-sponsor', 'Blogs &amp; Sponsor')"
    :description="
      $t(
        'text-blogs-and-sponsor-description',
        'Welcome to read my blogs about me or my projects!',
      )
    "
    :image="{
      avifSrcLight: '/images/avif/covers/blogs.avif',
      fallbackSrcLight: '/images/webp/covers/blogs.webp',
      alt: $t('text-blogs-and-sponsor', 'Blogs'),
      imgClass: 'img-fluid img-fit rounded',
    }"
  />

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
