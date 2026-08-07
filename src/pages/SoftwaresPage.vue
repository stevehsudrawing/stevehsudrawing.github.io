<!--
  SoftwaresPage.vue -- Softwares page hero section + link cards.
  Previously static content in softwares.html.

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
      <a
        class="link link-hover-change-background external-link larger-link fw-semibold"
        href="https://github.com/stevehsudrawing"
        data-link-img-props='{"alt":"Github","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/github.webp","dataColorVar":"bs-body-color"}'
      >
        <i class="bi bi-github"></i>
        <span>{{ $t("text-my-github-profile", "My GitHub Profile") }}</span>
      </a>
    </div>
  </HeroSection>

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
