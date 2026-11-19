<!--
  FooterNav.vue — site footer in three groups: the copyright line, the
  License / Artwork Copyright links, and the issue / changelog / share
  icon rail.
-->
<script setup lang="ts">
import { useChangelogModal } from "../../composables/modals/useChangelogModal";
import { BASE_URL, GITHUB_REPO } from "../../configs/site-meta.js";
import QRCodeButton from "../buttons/QRCodeButton.vue";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

const { openChangelogModal } = useChangelogModal();
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
        </div>

        <!-- ==== Licenses ==== -->
        <div class="d-flex flex-wrap align-items-center gap-2">
          <TypeAwareLink
            type="external"
            :href="`https://github.com/${GITHUB_REPO}/blob/main/LICENSE.md`"
            class="link"
            no-qr-code
          >
            {{ $t("text-license") }}
          </TypeAwareLink>
          <TypeAwareLink
            type="external"
            :href="`https://github.com/${GITHUB_REPO}/blob/main/public/images/README.md`"
            class="link"
            no-qr-code
          >
            {{ $t("text-artwork-copyright") }}
          </TypeAwareLink>
        </div>

        <!-- ==== Issue + Changelog + Share ==== -->
        <div class="ms-auto d-flex align-items-center">
          <TooltipTrigger :title="$t('text-report-an-issue')">
            <TypeAwareLink
              class="text-decoration-none me-2"
              type="external"
              :href="`https://github.com/${GITHUB_REPO}/issues`"
              no-qr-code
              hide-indicator
              no-underline
              :aria-label="$t('text-report-an-issue')"
            >
              <MaterialSymbol name="sms_failed" />
            </TypeAwareLink>
          </TooltipTrigger>
          <TooltipTrigger :title="$t('text-changelog')">
            <a
              role="button"
              class="text-decoration-none me-2"
              :aria-label="$t('text-changelog')"
              @click="openChangelogModal()"
            >
              <MaterialSymbol name="history" />
            </a>
          </TooltipTrigger>
          <QRCodeButton
            class="me-2"
            :url="BASE_URL"
            :icon="{
              type: 'colored-img',
              imgProps: {
                src: '/images/webp/icons/steve-hsu.webp',
                colorVar: 'bs-primary',
                alt: $t('text-steve-hsu-s-link-hub'),
              },
            }"
            hide-open-link
          >
            <MaterialSymbol name="share" fill />
          </QRCodeButton>
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
