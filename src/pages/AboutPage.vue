<!--
  AboutPage.vue -- About page hero section + profile table + link cards.
  Previously static content in about.html's <main id="page-content">.

  Phase 7: replaces static HTML content in about.html.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import CopyButton from "../components/buttons/CopyButton.vue";
import SectionHeading from "../components/ui/SectionHeading.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("about"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-about', 'About')"
    :description="
      $t('text-about-description', 'Learn more about me through this page!')
    "
    :image="{
      avifSrcLight: '/images/avif/covers/about.avif',
      fallbackSrcLight: '/images/webp/covers/about.webp',
      alt: $t('text-artworks', 'Artworks'),
      imgClass: 'img-fluid img-fit rounded no-copy solid-bg',
    }"
  />

  <hr />

  <!-- ==== Profile table ==== -->
  <div class="container">
    <div class="link-hub-part">
      <SectionHeading
        :title="$t('text-profile', 'Profile')"
        heading-id="profile"
        :page-path="pagePath"
        :base-url="BASE_URL"
      />
      <table class="table-borderless">
        <tbody>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🌐</th>
            <td>中文 / English</td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🗣</th>
            <td>
              <span>{{
                $t(
                  "text-profile-part-1",
                  'Pronunciation: /stiːv ɕy/. You can also call me "什五 (shí wǔ, ㄕˊ ㄨˇ or ジュウゴ)".',
                )
              }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">👤</th>
            <td>
              <span>{{
                $t(
                  "text-profile-part-2",
                  "He/Him. Virgo. MBTI personality: ISTP.",
                )
              }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🖌</th>
            <td>
              <span>{{
                $t(
                  "text-profile-part-3",
                  "I'm an amateur creator. I draw something and make video sometimes.",
                )
              }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">💾</th>
            <td>
              <span>{{ $t("text-profile-part-4", "Sometimes I code.") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🤔</th>
            <td>
              <span>{{
                $t(
                  "text-profile-part-5",
                  "I want to create more, code more and sleep more.",
                )
              }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🎨</th>
            <td>
              <span>{{ $t("text-profile-part-6", "My major color:") }}</span>
              <CopyButton
                class="link text-nowrap"
                copy-text="#47c4ee"
                style="color: #47c4ee"
              >
                <i class="bi bi-square-fill"></i>
                <code>#47c4ee</code>
                <i class="bi bi-clipboard"></i> </CopyButton
              >,&nbsp;
              <CopyButton
                class="link text-nowrap"
                copy-text="#3c96ff"
                style="color: #3c96ff"
              >
                <i class="bi bi-square-fill"></i>
                <code>#3c96ff</code>
                <i class="bi bi-clipboard"></i>
              </CopyButton>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">👾</th>
            <td>
              <span
                v-html="
                  $t(
                    'html-profile-part-7',
                    `Character settings of Steve Hsu in the <cite>Codename Staub</cite> worldview:`,
                  )
                "
              ></span>
              <a
                class="link external-link"
                href="https://afdian.com/p/590c0408806111f1b05f52540025c377"
                data-link-img-props='{"alt":"Afdian","dataI18nAlt":"text-afdian","src":"/images/webp/icons/afdian.webp"}'
                data-no-qr-code
              >
                <span>{{ $t("text-learn-more", "Learn More") }}</span>
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <hr />
  </div>

  <!-- ==== Link cards ==== -->
  <div v-if="groups" class="container pb-2">
    <LinkCardGroups
      :groups="groups"
      :page-path="pagePath"
      :base-url="BASE_URL"
    />
  </div>

  <hr />

  <!-- ==== Footer sticker ==== -->
  <div class="container">
    <div class="py-4 d-flex flex-column align-items-center">
      <FeatureAwarePicture
        avif-src-light="/images/avif/stickers/light/thanks.avif"
        avif-src-dark="/images/avif/stickers/dark/thanks.avif"
        fallback-src-light="/images/webp/stickers/light/thanks.webp"
        fallback-src-dark="/images/webp/stickers/dark/thanks.webp"
        feature="follow-theme"
        :alt="$t('text-sticker-of-thanks', 'Sticker (Thanks)')"
        :width="150"
        :height="150"
        img-class="no-copy solid-bg"
      />
      <p class="opacity-75 mt-3">
        <span>{{
          $t("text-thanks-for-your-visiting", "Thanks for your visiting!")
        }}</span>
      </p>
    </div>
  </div>
</template>
