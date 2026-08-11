<!--
  AboutPage.vue — About page hero section + profile table + link cards.
  Previously static content in about.html's <main id="page-content">.
-->
<script setup lang="ts">
import { ref } from "vue";
import LinkCardGroups from "../components/cards/LinkCardGroups.vue";
import CopyButton from "../components/buttons/CopyButton.vue";
import TypeAwareLink from "../components/links/TypeAwareLink.vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import SectionHeading from "../components/ui/SectionHeading.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import StickerSection from "../components/ui/StickerSection.vue";
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
      srcMap: {
        avif: { light: { en: '/images/avif/covers/about.avif' } },
        webp: { light: { en: '/images/webp/covers/about.webp' } },
      },
      alt: $t('text-artworks', 'Artworks'),
      class: 'img-fluid img-fit rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="about" />

  <hr />

  <!-- ==== Profile table ==== -->
  <div class="container">
    <div>
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
              <TypeAwareLink
                type="external"
                href="https://afdian.com/p/590c0408806111f1b05f52540025c377"
                no-qr-code
                class="link"
              >
                <span>{{ $t("text-learn-more", "Learn More") }}</span>
              </TypeAwareLink>
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
  <StickerSection
    sticker-id="thanks"
    :sticker-title="$t('text-sticker-of-thanks', 'Sticker (Thanks)')"
    :caption="$t('text-thanks-for-your-visiting', 'Thanks for your visiting!')"
  />
</template>
