<!--
  ChattingPage.vue — Chatting page hero section + link cards.
  Previously static content in chatting.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useLinkCards } from "../composables/content/useLinkCards";
import { usePictureRegistry } from "../composables/pictures/usePictureRegistry";

// Picture registry — resolves the hero cover props.
const { pictureProps } = usePictureRegistry();

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("chatting"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-chatting')"
    :description="$t('text-chatting-description')"
    :image="
      pictureProps('chatting', { showAltButton: true, previewable: true })
    "
  />

  <PageChainNav page-name="chatting" />

  <hr />

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container">
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>
</template>
