<!--
  AboutPage.vue -- About page hero section + profile table + link cards.
  Previously static content in about.html's <main id="page-content">.

  Phase 7: replaces static HTML content in about.html.
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import FeatureAwarePicture from "../components/ui/FeatureAwarePicture.vue";
import CopyButton from "../components/buttons/CopyButton.vue";
import AnchorButton from "../components/buttons/AnchorButton.vue";
import { useI18n } from "../composables/useI18n.js";
import { useLinkCards, BASE_URL } from "../composables/useLinkCards.js";

// =========================================================================
// i18n
// =========================================================================

const { t } = useI18n();

/** HTML i18n fallback for the profile Codename Staub line. */
const profilePart7Html = computed(() =>
  t(
    "html-profile-part-7",
    `Character settings of Steve Hsu in the <cite>Codename Staub</cite> worldview:`,
  ),
);

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("about"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <div class="container py-4 link-hub-part">
    <div class="d-flex align-items-center flex-wrap">
      <div class="col-12 col-md-8 col-lg-9 order-md-1 order-2">
        <h1>{{ $t("text-about", "About") }}</h1>
        <p>
          {{
            $t(
              "text-about-description",
              "Learn more about me through this page!",
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

  <!-- ==== Profile table ==== -->
  <div class="container">
    <div class="link-hub-part">
      <div class="title-link-group-wrapper">
        <h2 class="title-link-group h4" id="profile">
          {{ $t("text-profile", "Profile") }}
        </h2>
        <AnchorButton
          target-id="profile"
          :button-aria-label="$t('text-anchor-to-profile', 'Link to Profile')"
        />
        <CopyButton
          class="link title-link-anchor"
          copy-text="https://stevehsudrawing.github.io/about.html#profile"
        >
          <i class="bi bi-link-45deg"></i>
        </CopyButton>
      </div>
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
              <span v-html="profilePart7Html"></span>
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
