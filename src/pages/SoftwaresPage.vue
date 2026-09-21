<!--
  SoftwaresPage.vue — Softwares page hero section + link cards.
  Previously static content in softwares.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import GithubActivityStatsCard from "../components/cards/GithubActivityStatsCard.vue";
import GithubUserCard from "../components/cards/GithubUserCard.vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import SectionHeading from "../components/ui/SectionHeading.vue";
import { useLinkCards } from "../composables/content/useLinkCards";
import { usePictureRegistry } from "../composables/pictures/usePictureRegistry";

// Picture registry — resolves the hero cover props.
const { pictureProps } = usePictureRegistry();

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
    :image="
      pictureProps('projects', { showAltButton: true, previewable: true })
    "
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
        <GithubUserCard variant="full" />
      </div>
      <div class="col-lg-6">
        <GithubActivityStatsCard />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
