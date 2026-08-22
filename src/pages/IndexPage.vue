<!--
  IndexPage.vue — Home page hero sections.
  Contains the illustration, softwares, blogs, and chatting intro
  sections previously in index.html's <main id="page-content">.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkButtonGroup from "../components/buttons/LinkButtonGroup.vue";
import GitHubUserCard from "../components/cards/GitHubUserCard.vue";
import FeatureAwarePicture from "../components/images/FeatureAwarePicture.vue";
import TypeAwareLink from "../components/links/TypeAwareLink.vue";
import TooltipTrigger from "../components/render-functions/TooltipTrigger.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import StickerSection from "../components/ui/StickerSection.vue";
import { useBreakpoint } from "../composables/useBreakpoint";
import { useLinkButtonGroups } from "../composables/useLinkButtonGroups";
import type { LinkButtonGroupData } from "../types/app";

// =========================================================================
// State
// =========================================================================

/** BCarousel template ref for pause/resume. */
const carouselRef = ref<{ pause: () => void; resume: () => void } | null>(null);
/** Whether the carousel is currently auto-playing. */
const isPlaying = ref(true);
/** Reactive breakpoint (mobile / tablet / desktop) — shared singleton. */
const breakpoint = useBreakpoint();

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
  <div
    class="container"
    :class="{ 'large-hero-section': breakpoint !== 'mobile' }"
    id="illustration-section"
  >
    <div class="row align-items-center align-content-center flex-grow-1">
      <div class="col-md-6 order-md-1 order-2">
        <h1 v-html="$t('html-steve-hsu-s-link-hub')"></h1>
        <div class="py-2">
          <p>
            {{ $t("text-homepage-welcome") }}
          </p>
          <p>
            {{ $t("text-homepage-introduction-artworks") }}
          </p>
        </div>
        <LinkButtonGroup
          v-if="findGroup('artworks')"
          :buttons="findGroup('artworks')!.buttons"
        />
      </div>

      <!-- Illustration Carousel -->
      <div class="col-md-6 order-md-2 order-1 mb-4 mb-md-0">
        <div class="hero-cover-box">
          <BCarousel
            ref="carouselRef"
            class="rounded overflow-hidden"
            controls
            indicators
            :interval="6000"
            :ride="'carousel'"
          >
            <BCarouselSlide>
              <TypeAwareLink
                type="external"
                href="https://www.pixiv.net/artworks/145641748"
                :icon="{
                  type: 'picture',
                  imgProps: {
                    src: '/images/webp/icons/pixiv.webp',
                    alt: $t('text-pixiv'),
                  },
                }"
                hide-indicator
              >
                <FeatureAwarePicture
                  :src-map="{
                    avif: {
                      light: {
                        en: '/images/avif/covers/illustration-0-light.avif',
                      },
                      dark: {
                        en: '/images/avif/covers/illustration-0-dark.avif',
                      },
                    },
                    webp: {
                      light: {
                        en: '/images/webp/covers/illustration-0-light.webp',
                      },
                      dark: {
                        en: '/images/webp/covers/illustration-0-dark.webp',
                      },
                    },
                  }"
                  :feature="['follow-theme']"
                  :alt="$t('text-illustration')"
                  fetchpriority="high"
                  class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="external"
                href="https://www.pixiv.net/artworks/144184773"
                :icon="{
                  type: 'picture',
                  imgProps: {
                    src: '/images/webp/icons/pixiv.webp',
                    alt: $t('text-pixiv'),
                  },
                }"
                hide-indicator
              >
                <FeatureAwarePicture
                  :src-map="{
                    avif: {
                      light: { en: '/images/avif/covers/illustration-1.avif' },
                    },
                    webp: {
                      light: { en: '/images/webp/covers/illustration-1.webp' },
                    },
                  }"
                  :alt="$t('text-illustration')"
                  loading="lazy"
                  class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="internal"
                href="/gallery.html?preview=sticker-collection-series-1-vol-1"
                hide-indicator
              >
                <FeatureAwarePicture
                  :src-map="{
                    avif: {
                      light: { en: '/images/avif/covers/illustration-2.avif' },
                    },
                    webp: {
                      light: { en: '/images/webp/covers/illustration-2.webp' },
                    },
                  }"
                  :alt="$t('text-illustration')"
                  loading="lazy"
                  class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="internal"
                href="/gallery.html?preview=sticker-collection-series-2-vol-2"
                hide-indicator
              >
                <FeatureAwarePicture
                  :src-map="{
                    avif: {
                      light: { en: '/images/avif/covers/illustration-3.avif' },
                    },
                    webp: {
                      light: { en: '/images/webp/covers/illustration-3.webp' },
                    },
                  }"
                  :alt="$t('text-illustration')"
                  loading="lazy"
                  class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
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
    <TooltipTrigger :title="$t('text-my-softwares')">
      <TypeAwareLink
        class="scroll-down-tip"
        href="#softwares-section"
        type="anchor"
        hide-indicator
        v-if="breakpoint !== 'mobile'"
      >
        <span>{{ $t("text-scroll-down") }}</span>
        <i class="bi bi-chevron-down"></i>
      </TypeAwareLink>
    </TooltipTrigger>
  </div>

  <hr />

  <!-- ==== Softwares section ==== -->
  <div
    class="container"
    :class="{ 'large-hero-section': breakpoint !== 'mobile' }"
    id="softwares-section"
  >
    <div class="row align-items-center align-content-center flex-grow-1">
      <div class="col-md-6 order-md-1 order-2">
        <h2 class="h1">{{ $t("text-my-softwares") }}</h2>
        <div class="py-2">
          <p>
            {{ $t("text-homepage-introduction-software") }}
          </p>
        </div>
        <div class="pb-4">
          <GitHubUserCard variant="compact" />
        </div>
        <LinkButtonGroup
          v-if="findGroup('softwares')"
          :buttons="findGroup('softwares')!.buttons"
        />
      </div>
      <div class="col-md-6 order-md-2 order-1 mb-4 mb-md-0">
        <div class="hero-cover-box">
          <FeatureAwarePicture
            :src-map="{
              avif: { light: { en: '/images/avif/covers/projects.avif' } },
              webp: { light: { en: '/images/webp/covers/projects.webp' } },
            }"
            :alt="$t('text-softwares')"
            class="rounded"
          />
        </div>
      </div>
    </div>
    <TooltipTrigger :title="$t('text-more-links')">
      <TypeAwareLink
        class="scroll-down-tip"
        href="#blogs-sponsor-section"
        type="anchor"
        hide-indicator
        v-if="breakpoint !== 'mobile'"
      >
        <span>{{ $t("text-scroll-down") }}</span>
        <i class="bi bi-chevron-down"></i>
      </TypeAwareLink>
    </TooltipTrigger>
  </div>

  <hr />

  <!-- ==== Blogs & Sponsor section ==== -->
  <HeroSection
    id="blogs-sponsor-section"
    heading-tag="h2"
    :title="$t('text-blogs-and-sponsor')"
    :description="$t('text-blogs-and-sponsor-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/blogs.avif' } },
        webp: { light: { en: '/images/webp/covers/blogs.webp' } },
      },
      alt: $t('text-blogs-and-sponsor'),
      class: 'rounded',
    }"
    :padding="false"
  >
    <LinkButtonGroup
      v-if="findGroup('blogs-and-sponsor')"
      :buttons="findGroup('blogs-and-sponsor')!.buttons"
    />
  </HeroSection>

  <hr />

  <!-- ==== Chatting section ==== -->
  <HeroSection
    heading-tag="h2"
    :title="$t('text-chatting')"
    :description="$t('text-chatting-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/chatting.avif' } },
        webp: { light: { en: '/images/webp/covers/chatting.webp' } },
      },
      alt: $t('text-chatting'),
      class: 'rounded',
    }"
    :padding="false"
  >
    <LinkButtonGroup
      v-if="findGroup('chatting')"
      :buttons="findGroup('chatting')!.buttons"
    />
  </HeroSection>

  <hr />

  <!-- ==== Footer sticker + about link ==== -->
  <StickerSection sticker-id="thumb">
    <TypeAwareLink
      type="internal"
      href="/about.html"
      class="link link-hover-change-background link-secondary-shlh fw-semibold mt-3"
    >
      <span>{{ $t("text-about-me-and-my-emails") }}</span>
      <i class="bi bi-arrow-right"></i>
    </TypeAwareLink>
  </StickerSection>
</template>

<style>
.large-hero-section {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 64px);
}

/* --- CLS-safe square cover box (padding-top reserves the 1:1 box) --- */

.hero-cover-box {
  position: relative;
  width: 100%;
  padding-top: 100%;
}

.hero-cover-box > .carousel,
.hero-cover-box > picture,
.hero-cover-box > img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.hero-cover-box > picture > img,
.hero-cover-box > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scroll-down-tip {
  color: var(--bs-body-color);
  display: flex;
  flex-direction: column;
  height: 64px;
  justify-content: center;
  align-items: center;
  opacity: 0.75;
  gap: 0;
  font-size: 0.8rem;
}

.scroll-down-tip > i {
  font-size: 1rem;
}

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
