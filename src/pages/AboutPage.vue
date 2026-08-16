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
import { useLinkCards } from "../composables/useLinkCards";

// =========================================================================
// Link cards
// =========================================================================

const { groups, pagePath } = useLinkCards(ref("about"));
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-about')"
    :description="$t('text-about-description')"
    :image="{
      srcMap: {
        avif: { light: { en: '/images/avif/covers/about.avif' } },
        webp: { light: { en: '/images/webp/covers/about.webp' } },
      },
      alt: $t('text-artworks'),
      class: 'rounded no-copy solid-bg',
    }"
  />

  <PageChainNav page-name="about" />

  <hr />

  <!-- ==== Profile table ==== -->
  <div class="container">
    <div>
      <SectionHeading
        :title="$t('text-profile')"
        heading-id="profile"
        :page-path="pagePath"
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
              <span>{{ $t("text-profile-part-1") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">👤</th>
            <td>
              <span>{{ $t("text-profile-part-2") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🖌</th>
            <td>
              <span>{{ $t("text-profile-part-3") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">💾</th>
            <td>
              <span>{{ $t("text-profile-part-4") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🤔</th>
            <td>
              <span>{{ $t("text-profile-part-5") }}</span>
            </td>
          </tr>
          <tr class="pb-1">
            <th scope="row" class="pe-2 align-top">🎨</th>
            <td>
              <span>{{ $t("text-profile-part-6") }}</span>
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
              <span v-html="$t('html-profile-part-7')"></span>
              <TypeAwareLink
                type="external"
                href="https://afdian.com/p/590c0408806111f1b05f52540025c377"
                no-qr-code
                class="link"
              >
                <span>{{ $t("text-learn-more") }}</span>
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
    <LinkCardGroups :groups="groups" :page-path="pagePath" />
  </div>

  <hr />

  <!-- ==== Footer sticker ==== -->
  <StickerSection
    sticker-id="thanks"
    :caption="$t('text-thanks-for-your-visiting')"
  />
</template>
