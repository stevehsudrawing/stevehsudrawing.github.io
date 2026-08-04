<!--
  IndexPage.vue -- Home page hero sections.
  Contains the illustration, softwares, blogs, and chatting intro
  sections previously in index.html's <main id="page-content">.

  Phase 7: replaces static HTML content in index.html.
  Link button groups are rendered via useLinkButtonGroups().
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkButtonGroup from "../components/buttons/LinkButtonGroup.vue";
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import { useLinkButtonGroups } from "../composables/useLinkButtonGroups.js";
import type { LinkButtonGroupData } from "../types/app.js";

// =========================================================================
// Link button groups
// =========================================================================

const { groups } = useLinkButtonGroups(ref("index"));

/** Find a button group by its groupId. */
function findGroup(groupId: string): LinkButtonGroupData | undefined {
  return groups.value?.find((g) => g.groupId === groupId);
}
</script>

<template>
  <!-- ==== Illustration section ==== -->
  <div class="container link-hub-part">
    <div class="row align-items-center">
      <div class="col-lg-6 order-lg-1 order-2">
        <h1 data-i18n-html="html-steve-hsu-s-link-hub">
          <strong class="color-primary">Steve Hsu <small>什五</small></strong
          >'s Link-Hub
        </h1>
        <p data-i18n="text-homepage-welcome">
          Welcome! I'm an amateur creator. I draw something, make video, and
          code sometimes.
        </p>
        <p data-i18n="text-homepage-introduction-artworks">
          You might know me through my artworks and videos. You can view my more
          artworks from my Pixiv profile or my profile on other platforms.
        </p>
        <LinkButtonGroup
          v-if="findGroup('artworks')"
          :buttons="findGroup('artworks')!.buttons"
        />
      </div>
      <div class="col-lg-6 order-lg-2 order-1 mb-4 mb-lg-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/illustration-light.avif"
          avif-src-dark="/images/avif/covers/illustration-dark.avif"
          webp-src-light="/images/webp/covers/illustration-light.webp"
          webp-src-dark="/images/webp/covers/illustration-dark.webp"
          fallback-src-light="/images/png/covers/illustration-light.png"
          feature="follow-theme"
          alt="Illustration"
          data-i18n-alt="text-illustration"
          fetchpriority="high"
          img-class="img-fluid img-fit rounded no-copy solid-bg"
        />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Softwares section ==== -->
  <div class="container link-hub-part">
    <div class="row align-items-center">
      <div class="col-lg-6 order-lg-1 order-2">
        <h2 class="h1" data-i18n="text-my-softwares">My Softwares</h2>
        <p data-i18n="text-homepage-introduction-software">
          You might also know me through softwares I made (such as Quanto
          Series). You can check my GitHub profile to view open source projects,
          or go to the "Software" page to see more.
        </p>
        <LinkButtonGroup
          v-if="findGroup('softwares')"
          :buttons="findGroup('softwares')!.buttons"
        />
      </div>
      <div class="col-lg-6 order-lg-2 order-1 mb-4 mb-lg-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/projects.avif"
          fallback-src-light="/images/webp/covers/projects.webp"
          alt="Softwares"
          data-i18n-alt="text-softwares"
          img-class="img-fluid img-fit rounded"
        />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Blogs & Sponsor section ==== -->
  <div class="container link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h2 class="h1" data-i18n="text-blogs-and-sponsor">Blogs & Sponsor</h2>
        <p data-i18n="text-blogs-and-sponsor-description">
          Welcome to read my blogs about me or my projects!
        </p>
        <LinkButtonGroup
          v-if="findGroup('blogs-and-sponsor')"
          :buttons="findGroup('blogs-and-sponsor')!.buttons"
        />
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/blogs.avif"
          fallback-src-light="/images/webp/covers/blogs.webp"
          alt="Blogs &amp; Sponsor"
          data-i18n-alt="text-blogs-and-sponsor"
          img-class="img-fluid img-fit rounded"
        />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Chatting section ==== -->
  <div class="container link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h2 class="h1" data-i18n="text-chatting">Chatting</h2>
        <p data-i18n="text-chatting-description">
          Welcome to join my chat room for interaction!
        </p>
        <LinkButtonGroup
          v-if="findGroup('chatting')"
          :buttons="findGroup('chatting')!.buttons"
        />
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/chatting.avif"
          fallback-src-light="/images/webp/covers/chatting.webp"
          alt="Chatting"
          data-i18n-alt="text-chatting"
          img-class="img-fluid img-fit rounded"
        />
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Footer sticker + about link ==== -->
  <div class="container">
    <div class="py-4 d-flex flex-column align-items-center">
      <FeatureAwarePicture
        avif-src-light="/images/avif/stickers/light/thumb.avif"
        avif-src-dark="/images/avif/stickers/dark/thumb.avif"
        fallback-src-light="/images/webp/stickers/light/thumb.webp"
        fallback-src-dark="/images/webp/stickers/dark/thumb.webp"
        feature="follow-theme"
        alt="Sticker (Thumb)"
        data-i18n-alt="text-sticker-of-thumb"
        :width="150"
        :height="150"
        class="no-copy solid-bg"
      />
      <a
        class="link link-hover-change-background link-secondary-shlh internal-link fw-semibold mt-3"
        href="/about.html"
      >
        <span data-i18n="text-about-me-and-my-emails"
          >About me and my emails</span
        >
        <i class="bi bi-arrow-right"></i>
      </a>
    </div>
  </div>
</template>
