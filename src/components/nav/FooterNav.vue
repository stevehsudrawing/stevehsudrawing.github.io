<!--
  FooterNav.vue — site footer with copyright, external links, and QR share trigger.
-->
<script setup lang="ts">
import QRCodeButton from "../buttons/QRCodeButton.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import { BASE_URL, GITHUB_REPO } from "../../configs/page-meta";
</script>

<template>
  <footer class="bg-body-tertiary py-4 footer">
    <div class="container">
      <div class="text-muted d-flex flex-wrap align-items-center gap-2">
        <!-- ==== Copyright ==== -->
        <div class="flex-grow-1 align-items-center">
          {{ $t("text-copyright-part-1") }} &copy; 2024 - 2026
          <TooltipTrigger :title="$t('text-about-me-and-my-emails')">
            <TypeAwareLink
              type="internal"
              href="/about.html"
              class="link"
              :aria-label="$t('text-about-me-and-my-emails')"
            >
              {{ $t("text-steve-hsu") }}
            </TypeAwareLink>
          </TooltipTrigger>
          {{ $t("text-copyright-part-2") }}
          <TypeAwareLink
            type="internal"
            href="/copyright-notice.html"
            class="link"
          >
            {{ $t("text-artwork-copyright") }}
          </TypeAwareLink>
        </div>

        <!-- ==== Powered by ==== -->
        <div>
          <span>{{ $t("text-powered-by-part-1") }}</span>
          <TypeAwareLink
            href="https://vite.dev/"
            type="external"
            no-qr-code
            class="link"
            >Vite</TypeAwareLink
          >
          <span>{{ $t("text-and") }}</span>
          <TypeAwareLink
            :href="$t('text-vue-js-site')"
            type="external"
            no-qr-code
            class="link"
            >Vue.js</TypeAwareLink
          >
          <span>{{ $t("text-powered-by-part-2") }}</span>
        </div>

        <!-- ==== Issue ==== -->
        <div>
          <TypeAwareLink
            class="text-nowrap"
            type="external"
            :href="`https://github.com/${GITHUB_REPO}/issues`"
            no-qr-code
          >
            {{ $t("text-report-an-issue") }}
          </TypeAwareLink>
        </div>
        <!-- ==== Share + View Code ==== -->
        <div class="ms-auto">
          <QRCodeButton
            class="me-2"
            :url="BASE_URL"
            :colored-props="{
              src: '/images/webp/icons/steve-hsu.webp',
              colorVar: 'bs-primary',
              alt: $t('text-steve-hsu-s-link-hub'),
            }"
            hide-open-link
          >
            <i class="bi bi-share-fill"></i>
          </QRCodeButton>
          <TooltipTrigger :title="$t('text-view-code')">
            <TypeAwareLink
              type="external"
              :href="`https://github.com/${GITHUB_REPO}`"
              hide-indicator
              :colored-props="{
                src: '/images/webp/icons/github.webp',
                colorVar: 'bs-body-color',
                alt: $t('text-repo-of-steve-hsu-s-link-hub'),
              }"
              :aria-label="$t('text-view-code')"
            >
              <i class="bi bi-github"></i>
            </TypeAwareLink>
          </TooltipTrigger>
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
