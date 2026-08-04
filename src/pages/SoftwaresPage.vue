<!--
  SoftwaresPage.vue -- Softwares page hero section + link cards.
  Previously static content in softwares.html.

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

const { groups, pagePath } = useLinkCards(ref("softwares"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <div class="container py-4 link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h1>{{ $t("text-softwares", "Softwares") }}</h1>
        <p>
          {{
            $t("text-softwares-description", "Welcome to view my softwares!")
          }}
        </p>
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
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/projects.avif"
          fallback-src-light="/images/webp/covers/projects.webp"
          :alt="$t('text-softwares', 'Softwares')"
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
