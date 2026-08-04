<!--
  ArtworksPage.vue -- Artworks & Videos page hero section + link cards.
  Previously static content in artworks-and-videos.html.

  Phase 7: replaces static HTML content.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards.js";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("artworks-and-videos"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <div class="container py-4 link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h1>{{ $t("text-artworks-and-videos", "Artworks & Videos") }}</h1>
        <p>
          {{
            $t(
              "text-artworks-and-videos-description",
              "Welcome to view my personal artworks and videos through other platforms!",
            )
          }}
        </p>
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/artworks-light.avif"
          avif-src-dark="/images/avif/covers/artworks-dark.avif"
          fallback-src-light="/images/webp/covers/artworks-light.webp"
          fallback-src-dark="/images/webp/covers/artworks-dark.webp"
          feature="follow-theme"
          :alt="$t('text-artworks', 'Artworks')"
          img-class="img-fluid img-fit rounded no-copy solid-bg"
        />
      </div>
    </div>
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
