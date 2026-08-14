<!--
  FooterNav.vue — site footer with copyright, external links, and QR share trigger.
-->
<script setup lang="ts">
import QRCodeButton from "../buttons/QRCodeButton.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import { BASE_URL, GITHUB_REPO } from "../../core/page-meta";
</script>

<template>
  <footer class="bg-body-tertiary py-4 footer">
    <div class="container">
      <div class="text-muted d-flex flex-wrap align-items-center gap-2">
        <!-- ==== Copyright ==== -->
        <div class="flex-grow-1 align-items-center">
          {{ $t("text-copyright-part-1", "Copyright") }} &copy; 2024 - 2026
          <TooltipTrigger
            :title="$t('text-about-me-and-my-emails', 'About Me and E-mail')"
          >
            <TypeAwareLink
              type="internal"
              href="/about.html"
              class="link"
              :aria-label="
                $t('text-about-me-and-my-emails', 'About Me and E-mail')
              "
            >
              {{ $t("text-steve-hsu", "Steve Hsu (什五)") }}
            </TypeAwareLink>
          </TooltipTrigger>
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
            :href="`https://github.com/${GITHUB_REPO}/issues`"
            no-qr-code
          >
            {{ $t("text-report-an-issue", "Report an Issue") }}
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
              alt: $t('text-steve-hsu-s-link-hub', 'Steve Hsu\'s Link-Hub'),
            }"
            hide-open-link
          >
            <i class="bi bi-share-fill"></i>
          </QRCodeButton>
          <TooltipTrigger :title="$t('text-view-code', 'View Code')">
            <TypeAwareLink
              type="external"
              :href="`https://github.com/${GITHUB_REPO}`"
              hide-indicator
              :colored-props="{
                src: '/images/webp/icons/github.webp',
                colorVar: 'bs-body-color',
                alt: $t(
                  'text-repo-of-steve-hsu-s-link-hub',
                  'Repo of Steve Hsu\'s Link-Hub',
                ),
              }"
              :aria-label="$t('text-view-code', 'View Code')"
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
