<!--
  SoftwaresPage.vue — Softwares page hero section + link cards.
  Previously static content in softwares.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import TypeAwareLink from "../components/links/TypeAwareLink.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards";
import GitHubUserCard from "../components/cards/GitHubUserCard.vue";
import SectionHeading from "../components/ui/SectionHeading.vue";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("softwares"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-softwares', 'Softwares')"
    :description="
      $t('text-softwares-description', 'Welcome to view my softwares!')
    "
    :image="{
      avifSrcLight: '/images/avif/covers/projects.avif',
      fallbackSrcLight: '/images/webp/covers/projects.webp',
      alt: $t('text-softwares', 'Softwares'),
      imgClass: 'img-fluid img-fit rounded',
    }"
  >
  </HeroSection>

  <PageChainNav page-name="softwares" />

  <hr />

  <div class="container pb-2">
    <SectionHeading
      :title="$t('text-my-github-profile', 'My GitHub Profile')"
      :page-path="'softwares.html'"
      :base-url="'https://stevehsudrawing.github.io'"
    />
    <GitHubUserCard variant="full" />
  </div>

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
