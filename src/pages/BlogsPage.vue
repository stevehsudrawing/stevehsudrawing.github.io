<!--
  BlogsPage.vue -- Blogs & Sponsor page hero section + link cards.
  Previously static content in blogs-and-sponsor.html.

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

const { groups, pagePath } = useLinkCards(ref("blogs-and-sponsor"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <div class="container py-4 link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h1 data-i18n="text-blogs-and-sponsor">Blogs & Sponsor</h1>
        <p data-i18n="text-blogs-and-sponsor-description">
          Welcome to read my blogs about me or my projects!
        </p>
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/blogs.avif"
          fallback-src-light="/images/webp/covers/blogs.webp"
          alt="Blogs"
          data-i18n-alt="text-blogs-and-sponsor"
          img-class="img-fluid img-fit rounded"
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
