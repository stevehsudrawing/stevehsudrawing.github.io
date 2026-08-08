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
    <div>
      <TypeAwareLink
        type="external"
        href="https://github.com/stevehsudrawing"
        :img-props="{
          lightSrc: '/images/webp/null.webp',
          feature: 'colored',
          colorMaskSrc: '/images/webp/icons/github.webp',
          colorVar: 'bs-body-color',
          alt: $t('text-github', 'GitHub'),
        }"
        class="link link-hover-change-background larger-link fw-semibold"
      >
        <i class="bi bi-github"></i>
        <span>{{ $t("text-my-github-profile", "My GitHub Profile") }}</span>
      </TypeAwareLink>
    </div>
  </HeroSection>

  <PageChainNav page-name="softwares" />

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
