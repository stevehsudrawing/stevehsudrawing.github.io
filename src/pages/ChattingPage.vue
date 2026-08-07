<!--
  ChattingPage.vue -- Chatting page hero section + link cards.
  Previously static content in chatting.html.

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

const { groups, pagePath } = useLinkCards(ref("chatting"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-chatting', 'Chatting')"
    :description="
      $t(
        'text-chatting-description',
        'Welcome to join my chat room for interaction!',
      )
    "
    :image="{
      avifSrcLight: '/images/avif/covers/chatting.avif',
      fallbackSrcLight: '/images/webp/covers/chatting.webp',
      alt: $t('text-chatting', 'Chatting'),
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
