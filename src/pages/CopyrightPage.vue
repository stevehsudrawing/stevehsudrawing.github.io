<!--
  CopyrightPage.vue -- Copyright notice for original artworks.
  Renders the markdown content from public/images/README.md
  via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";

// =========================================================================
// Markdown content (build-time raw import)
// =========================================================================

import copyrightMd from "../../public/images/README.md?raw";
</script>

<template>
  <!-- ==== Hero section ==== -->
  <div class="container py-4 link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h1>
          {{
            $t(
              "text-copyright-notice-title",
              "Copyright Notice for Original Artworks",
            )
          }}
        </h1>
        <p>
          {{
            $t(
              "text-copyright-notice-description",
              "Copyright notice and usage terms for original artworks by Steve Hsu (什五).",
            )
          }}
        </p>
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/about.avif"
          fallback-src-light="/images/webp/covers/about.webp"
          :alt="$t('text-artworks', 'Artworks')"
          img-class="img-fluid img-fit rounded no-copy solid-bg"
        />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle :content="copyrightMd" />
</template>
