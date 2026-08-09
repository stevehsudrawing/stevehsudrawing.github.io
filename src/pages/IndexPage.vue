<!--
  IndexPage.vue — Home page hero sections.
  Contains the illustration, softwares, blogs, and chatting intro
  sections previously in index.html's <main id="page-content">.
-->
<script setup lang="ts">
import { onMounted, ref } from "vue";
import LinkButtonGroup from "../components/buttons/LinkButtonGroup.vue";
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import StickerSection from "../components/ui/StickerSection.vue";
import TypeAwareLink from "../components/links/TypeAwareLink.vue";
import { useLinkButtonGroups } from "../composables/useLinkButtonGroups";
import { useDelayedTooltip } from "../composables/useDelayedTooltip";
import type { LinkButtonGroupData } from "../types/app";

// =========================================================================
// State
// =========================================================================

/** BCarousel template ref for pause/resume. */
const carouselRef = ref<{ pause: () => void; resume: () => void } | null>(null);
/** Whether the carousel is currently auto-playing. */
const isPlaying = ref(true);

const isMobile = ref(false);

function onResize(): void {
  isMobile.value = window.innerWidth < 992;
}

// ---- Tooltip (delayed manual control) ----

/** Delayed tooltip for the scroll-down tip in the illustration section. */
const softwaresTip = useDelayedTooltip(500);
/** Delayed tooltip for the scroll-down tip in the softwares section. */
const moreLinksTip = useDelayedTooltip(500);

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

onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});

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
  <div class="container large-hero-section" id="illustration-section">
    <div class="row align-items-center flex-grow-1">
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
              <TypeAwareLink
                type="external"
                href="https://www.pixiv.net/artworks/145641748"
                :img-props="{
                  lightSrc: '/images/webp/icons/pixiv.webp',
                  alt: $t('text-pixiv', 'Pixiv'),
                }"
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
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="external"
                href="https://www.pixiv.net/artworks/144184773"
                :img-props="{
                  lightSrc: '/images/webp/icons/pixiv.webp',
                  alt: $t('text-pixiv', 'Pixiv'),
                }"
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-1.avif"
                  fallback-src-light="/images/webp/covers/illustration-1.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="internal"
                href="/artworks-and-videos.html#sticker-collections"
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-2.avif"
                  fallback-src-light="/images/webp/covers/illustration-2.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
                />
              </TypeAwareLink>
            </BCarouselSlide>
            <BCarouselSlide>
              <TypeAwareLink
                type="internal"
                href="/artworks-and-videos.html#sticker-collections"
              >
                <FeatureAwarePicture
                  avif-src-light="/images/avif/covers/illustration-3.avif"
                  fallback-src-light="/images/webp/covers/illustration-3.webp"
                  :alt="$t('text-illustration', 'Illustration')"
                  loading="lazy"
                  img-class="d-block w-100 no-copy solid-bg"
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
    <a
      class="scroll-down-tip"
      v-if="!isMobile"
      href="#softwares-section"
      v-b-tooltip.top.manual="{
        modelValue: softwaresTip.visible,
        title: $t('text-my-softwares', 'My Softwares'),
      }"
      @mouseenter="softwaresTip.scheduleShow()"
      @mouseleave="softwaresTip.cancelAndHide()"
      @click="softwaresTip.cancelAndHide()"
    >
      <span>{{ $t("text-scroll-down", "scroll down") }}</span>
      <i class="bi bi-chevron-down"></i>
    </a>
  </div>

  <hr />

  <!-- ==== Softwares section ==== -->
  <div class="container large-hero-section" id="softwares-section">
    <div class="row align-items-center flex-grow-1">
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
    <a
      class="scroll-down-tip"
      v-if="!isMobile"
      href="#blogs-sponsor-section"
      v-b-tooltip.top.manual="{
        modelValue: moreLinksTip.visible,
        title: $t('text-more-links', 'More Links'),
      }"
      @mouseenter="moreLinksTip.scheduleShow()"
      @mouseleave="moreLinksTip.cancelAndHide()"
      @click="moreLinksTip.cancelAndHide()"
    >
      <span>{{ $t("text-scroll-down", "scroll down") }}</span>
      <i class="bi bi-chevron-down"></i>
    </a>
  </div>

  <hr />

  <!-- ==== Blogs & Sponsor section ==== -->
  <HeroSection
    id="blogs-sponsor-section"
    heading-tag="h2"
    :title="$t('text-blogs-and-sponsor', 'Blogs &amp; Sponsor')"
    :description="
      $t(
        'text-blogs-and-sponsor-description',
        'Welcome to read my blogs about me or my projects!',
      )
    "
    :image="{
      avifSrcLight: '/images/avif/covers/blogs.avif',
      fallbackSrcLight: '/images/webp/covers/blogs.webp',
      alt: $t('text-blogs-and-sponsor', 'Blogs &amp; Sponsor'),
      imgClass: 'img-fluid img-fit rounded',
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
    :padding="false"
  >
    <LinkButtonGroup
      v-if="findGroup('chatting')"
      :buttons="findGroup('chatting')!.buttons"
    />
  </HeroSection>

  <hr />

  <!-- ==== Footer sticker + about link ==== -->
  <StickerSection
    sticker-id="thumb"
    :sticker-title="$t('text-sticker-of-thumb', 'Sticker (Thumb)')"
  >
    <TypeAwareLink
      type="internal"
      href="/about.html"
      class="link link-hover-change-background link-secondary-shlh fw-semibold mt-3"
    >
      <span>{{
        $t("text-about-me-and-my-emails", "About me and my emails")
      }}</span>
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
