<!--
  FooterNav.vue — site footer with copyright, external links, and QR share trigger.
-->
<script setup lang="ts">
import { useDelayedTooltip } from "../../composables/useDelayedTooltip";
import QRCodeButton from "../buttons/QRCodeButton.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";

// ---- Tooltip ----

const aboutTip = useDelayedTooltip(500);
const viewCodeTip = useDelayedTooltip(500);
</script>

<template>
  <footer class="bg-body-tertiary py-4 footer">
    <div class="container">
      <div class="text-muted d-flex flex-wrap align-items-center gap-2">
        <!-- ==== Copyright ==== -->
        <div class="flex-grow-1 align-items-center">
          {{ $t("text-copyright-part-1", "Copyright") }} &copy; 2024 - 2026
          <TypeAwareLink
            type="internal"
            href="/about.html"
            class="link"
            :aria-label="
              $t('text-about-me-and-my-emails', 'About Me and E-mail')
            "
            v-b-tooltip.top.manual="{
              modelValue: aboutTip.visible,
              title: $t('text-about-me-and-my-emails', 'About Me and E-mail'),
            }"
            @mouseenter="aboutTip.scheduleShow()"
            @mouseleave="aboutTip.cancelAndHide()"
            @click="aboutTip.cancelAndHide()"
            >{{ $t("text-steve-hsu", "Steve Hsu") }}</TypeAwareLink
          >
          {{ $t("text-copyright-part-2", ". All rights reserved.") }}
          <TypeAwareLink
            type="internal"
            href="/copyright-notice.html"
            class="link"
          >
            {{ $t("text-artwork-copyright", "Artwork Copyright") }}
          </TypeAwareLink>
        </div>

        <!-- ==== Powered by ==== -->
        <div>
          <span>{{ $t("text-powered-by-part-1", "Powered by") }}</span>
          <TypeAwareLink
            href="https://vite.dev/"
            type="external"
            no-qr-code
            class="link"
            >Vite</TypeAwareLink
          >
          <span>{{ $t("text-and", "and") }}</span>
          <TypeAwareLink
            :href="$t('text-vue-js-site', 'https://vuejs.org/')"
            type="external"
            no-qr-code
            class="link"
            >Vue.js</TypeAwareLink
          >
          <span>{{ $t("text-powered-by-part-2", ".") }}</span>
        </div>

        <!-- ==== Issue ==== -->
        <div>
          <TypeAwareLink
            class="text-nowrap"
            type="external"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io/issues"
            :img-props="{
              lightSrc: '/images/webp/null.webp',
              feature: 'colored',
              colorMaskSrc: '/images/webp/icons/github.webp',
              colorVar: 'bs-body-color',
              alt: $t('text-github', 'GitHub'),
            }"
            no-qr-code
          >
            {{ $t("text-report-an-issue", "Report an Issue") }}
          </TypeAwareLink>
        </div>
        <!-- ==== Share + View Code ==== -->
        <div class="ms-auto">
          <QRCodeButton
            class="me-2"
            :url="'https://stevehsudrawing.github.io'"
            :img-props="{
              lightSrc: '/images/webp/null.webp',
              feature: 'colored',
              colorMaskSrc: '/images/webp/icons/steve-hsu.webp',
              colorVar: 'bs-primary',
              alt: $t('text-steve-hsu-s-link-hub', 'Steve Hsu\'s Link-Hub'),
            }"
            hide-open-link
          >
            <i class="bi bi-share-fill"></i>
          </QRCodeButton>
          <TypeAwareLink
            type="external"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io"
            :img-props="{
              lightSrc: '/images/webp/null.webp',
              feature: 'colored',
              colorMaskSrc: '/images/webp/icons/github.webp',
              colorVar: 'bs-body-color',
              alt: $t(
                'text-repo-of-steve-hsu-s-link-hub',
                'Repo of Steve Hsu\'s Link-Hub',
              ),
            }"
            :aria-label="$t('text-view-code', 'View Code')"
            v-b-tooltip.top.manual="{
              modelValue: viewCodeTip.visible,
              title: $t('text-view-code', 'View Code'),
            }"
            @mouseenter="viewCodeTip.scheduleShow()"
            @mouseleave="viewCodeTip.cancelAndHide()"
            @click="viewCodeTip.cancelAndHide()"
          >
            <i class="bi bi-github"></i>
          </TypeAwareLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* ==== Footer ==== */

.footer {
  font-size: 0.8rem;
}
</style>
