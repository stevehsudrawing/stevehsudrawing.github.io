<!--
  SoftwaresPage.vue — Softwares page hero section + link cards.
  Previously static content in softwares.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import GitHubActivityStatsCard from "../components/cards/GitHubActivityStatsCard.vue";
import GitHubUserCard from "../components/cards/GitHubUserCard.vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import SectionHeading from "../components/ui/SectionHeading.vue";
import { useLinkCards } from "../composables/useLinkCards";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("softwares"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-softwares')"
    :description="$t('text-softwares-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/projects.avif' } },
        webp: { light: { en: '/images/webp/covers/projects.webp' } },
      },
      alt: $t('text-softwares'),
      class: 'rounded',
    }"
  >
  </HeroSection>

  <PageChainNav page-name="softwares" />

  <hr />

  <!-- === My GitHub Profile === -->
  <div class="container pb-2">
    <SectionHeading
      :title="$t('text-my-github-profile')"
      :page-path="'softwares.html'"
    />
    <div class="row g-0">
      <div class="col-lg-6">
        <GitHubUserCard variant="full" />
      </div>
      <div class="col-lg-6">
        <GitHubActivityStatsCard />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
