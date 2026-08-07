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
import { useLinkButtonGroups } from "../composables/useLinkButtonGroups";
import type { LinkButtonGroupData } from "../types/app";

// =========================================================================
// State
// =========================================================================

/** BCarousel template ref for pause/resume. */
const carouselRef = ref<{ pause: () => void; resume: () => void } | null>(null);
/** Whether the carousel is currently auto-playing. */
const isPlaying = ref(true);

// =========================================================================
// Actions
// =========================================================================

/** Toggle the carousel between auto-play and paused. */
function togglePlay(): void {
  if (isPlaying.value) {
    carouselRef.value?.pause();
  } else {
    carouselRef.value?.resume();
  }
  isPlaying.value = !isPlaying.value;
}

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
        <h1 v-html="$t('html-steve-hsu-s-link-hub')"></h1>
        <div class="py-2">
          <p>
            {{
              $t(
                "text-homepage-welcome",
                "Welcome! I'm an amateur creator. I draw something, make video, and code sometimes.",
              )
            }}
          </p>
          <p>
            {{
              $t(
                "text-homepage-introduction-artworks",
                "You might know me through my artworks and videos. You can view my more artworks from my Pixiv profile or my profile on other platforms.",
              )
            }}
          </p>
        </div>
        <LinkButtonGroup
          v-if="findGroup('artworks')"
          :buttons="findGroup('artworks')!.buttons"
        />
      </div>

      <!-- Illustration Carousel -->
      <div class="col-lg-6 order-lg-2 order-1 mb-4 mb-lg-0">
        <div class="position-relative">
          <BCarousel
            ref="carouselRef"
            class="rounded overflow-hidden"
            controls
            indicators
            :interval="6000"
            :ride="'carousel'"
          >
            <BCarouselSlide>
              <a
                class="external-link"
                href="https://www.pixiv.net/artworks/145641748"
                data-link-img-props='{"alt":"Pixiv","src":"/images/webp/icons/pixiv.webp"}'
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-0-light.avif"
                  avif-src-dark="/images/avif/covers/illustration-0-dark.avif"
                  fallback-src-light="/images/webp/covers/illustration-0-light.webp"
                  fallback-src-dark="/images/webp/covers/illustration-0-dark.webp"
                  feature="follow-theme"
                  :alt="$t('text-illustration', 'Illustration')"
                  fetchpriority="high"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </a>
            </BCarouselSlide>
            <BCarouselSlide>
              <a
                class="external-link"
                href="https://www.pixiv.net/artworks/144184773"
                data-link-img-props='{"alt":"Pixiv","src":"/images/webp/icons/pixiv.webp"}'
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-1.avif"
                  fallback-src-light="/images/webp/covers/illustration-1.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </a>
            </BCarouselSlide>
            <BCarouselSlide>
              <a
                class="internal-link"
                href="/artworks-and-videos.html#sticker-collections"
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-2.avif"
                  fallback-src-light="/images/webp/covers/illustration-2.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </a>
            </BCarouselSlide>
            <BCarouselSlide>
              <a
                class="internal-link"
                href="/artworks-and-videos.html#sticker-collections"
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-3.avif"
                  fallback-src-light="/images/webp/covers/illustration-3.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </a>
            </BCarouselSlide>
          </BCarousel>
          <button
            class="btn btn-outline-body-color btn-no-border carousel-play-toggle position-absolute bottom-0 start-0"
            type="button"
            :aria-label="isPlaying ? 'Pause' : 'Play'"
            @click="togglePlay"
          >
            <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <hr />

  <!-- ==== Softwares section ==== -->
  <div class="container link-hub-part">
    <div class="row align-items-center">
      <div class="col-lg-6 order-lg-1 order-2">
        <h2 class="h1">{{ $t("text-my-softwares", "My Softwares") }}</h2>
        <div class="py-2">
          <p>
            {{
              $t(
                "text-homepage-introduction-software",
                'You might also know me through softwares I made (such as Quanto Series). You can check my GitHub profile to view open source projects, or go to the "Software" page to see more.',
              )
            }}
          </p>
        </div>
        <LinkButtonGroup
          v-if="findGroup('softwares')"
          :buttons="findGroup('softwares')!.buttons"
        />
      </div>
      <div class="col-lg-6 order-lg-2 order-1 mb-4 mb-lg-0">
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

  <!-- ==== Blogs & Sponsor section ==== -->
  <div class="container link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h2 class="h1">
          {{ $t("text-blogs-and-sponsor", "Blogs & Sponsor") }}
        </h2>
        <div class="py-2">
          <p>
            {{
              $t(
                "text-blogs-and-sponsor-description",
                "Welcome to read my blogs about me or my projects!",
              )
            }}
          </p>
        </div>
        <LinkButtonGroup
          v-if="findGroup('blogs-and-sponsor')"
          :buttons="findGroup('blogs-and-sponsor')!.buttons"
        />
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/blogs.avif"
          fallback-src-light="/images/webp/covers/blogs.webp"
          :alt="$t('text-blogs-and-sponsor', 'Blogs &amp; Sponsor')"
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
        <h2 class="h1">{{ $t("text-chatting", "Chatting") }}</h2>
        <div class="py-2">
          <p>
            {{
              $t(
                "text-chatting-description",
                "Welcome to join my chat room for interaction!",
              )
            }}
          </p>
        </div>
        <LinkButtonGroup
          v-if="findGroup('chatting')"
          :buttons="findGroup('chatting')!.buttons"
        />
      </div>
      <div class="sub-cover-wrapper col-md-3 order-md-2 order-1 mb-4 mb-md-0">
        <FeatureAwarePicture
          avif-src-light="/images/avif/covers/chatting.avif"
          fallback-src-light="/images/webp/covers/chatting.webp"
          :alt="$t('text-chatting', 'Chatting')"
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
        :alt="$t('text-sticker-of-thumb', 'Sticker (Thumb)')"
        :width="150"
        :height="150"
        class="no-copy solid-bg"
      />
      <a
        class="link link-hover-change-background link-secondary-shlh internal-link fw-semibold mt-3"
        href="/about.html"
      >
        <span>{{
          $t("text-about-me-and-my-emails", "About me and my emails")
        }}</span>
        <i class="bi bi-arrow-right"></i>
      </a>
    </div>
  </div>
</template>

<style>
.carousel-indicators *,
.carousel-control-prev,
.carousel-control-next {
  filter: invert(1) drop-shadow(0 0 4px rgba(var(--bs-body-bg-rgb), 0.5));
}

[data-bs-theme="dark"] .carousel-control-prev,
[data-bs-theme="dark"] .carousel-control-next {
  filter: drop-shadow(0 0 4px rgba(var(--bs-body-bg-rgb), 0.5));
}

/* --- BCarouselSlide Tweaks --- */

.carousel-item > img.b-img[src=""],
.carousel-item > img.b-img:not([src]) {
  display: none;
}

.carousel-item .carousel-caption {
  position: static;
  padding: 0;
}

/* --- Carousel controls: visible on mouse hover, always visible for keyboard --- */

.carousel-control-prev,
.carousel-control-next {
  opacity: 0;
  transition: opacity 0.2s ease;
}

html.user-input-keyboard .carousel-control-prev,
html.user-input-keyboard .carousel-control-next {
  opacity: 1 !important;
}

html.user-input-pointer .carousel:hover .carousel-control-prev,
html.user-input-pointer .carousel:hover .carousel-control-next {
  opacity: 1 !important;
}

/* --- Play/pause toggle --- */

.carousel-play-toggle {
  padding: 0.25rem 0.6rem;
  font-size: 2rem;
  z-index: 1005;
  opacity: 1;
  transition: opacity 0.2s ease;
}
</style>
