<!--
  FooterNav.vue -- site footer with copyright, external links, and QR share trigger.

  Replaces build/page-components/footer.html.
  Links use data-link-img-props / data-qr-url for App.vue event delegation.
-->
<script setup lang="ts">
// (no setup needed -- footer links use App.vue event delegation)
</script>

<template>
  <footer class="bg-body-tertiary py-4 footer">
    <div class="container">
      <div class="text-muted d-flex flex-wrap align-items-center gap-2">
        <!-- ==== Copyright ==== -->
        <div class="flex-grow-1 align-items-center">
          {{ $t("text-copyright-part-1", "Copyright") }} &copy; 2024 - 2026
          <a
            class="link internal-link"
            href="/about.html"
            :aria-label="
              $t('text-about-me-and-my-emails', 'About Me and E-mail')
            "
            v-b-tooltip="
              $t('text-about-me-and-my-emails', 'About Me and E-mail')
            "
            >{{ $t("text-steve-hsu", "Steve Hsu") }}</a
          >
          {{ $t("text-copyright-part-2", ". All rights reserved.") }}
          <a class="link internal-link" href="/copyright-notice.html">
            {{ $t("text-artwork-copyright", "Artwork Copyright") }}
          </a>
        </div>

        <!-- ==== Powered by ==== -->
        <div>
          <span v-html="$t('html-powered-by')"></span>
        </div>

        <!-- ==== Issue + Share + View Code ==== -->
        <div class="ms-auto">
          <a
            class="link external-link text-nowrap me-2"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io/issues"
            data-link-img-props='{"alt":"GitHub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/github.webp","dataColorVar":"bs-body-color"}'
            data-no-qr-code
          >
            {{ $t("text-report-an-issue", "Report an Issue") }}
          </a>
          <a
            class="link text-nowrap me-2"
            href="javascript:void(0)"
            role="button"
            data-qr-url="https://stevehsudrawing.github.io"
            data-qr-icon='{"alt":"Steve Hsu&#39;s Link-Hub","dataI18nAlt":"text-steve-hsu-s-link-hub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/steve-hsu.webp","dataColorVar":"bs-primary"}'
            :aria-label="$t('text-share-this-website', 'Share this website!')"
            v-b-tooltip="{
              title: $t('text-share-this-website', 'Share this website!'),
              delay: { show: 500 },
            }"
            data-no-open-link
          >
            <i class="bi bi-share-fill"></i>
          </a>
          <a
            class="link external-link text-nowrap"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io"
            :aria-label="$t('text-view-code', 'View Code')"
            v-b-tooltip="{
              title: $t('text-view-code', 'View Code'),
              delay: { show: 500 },
            }"
            data-link-img-props='{"alt":"Repo of Steve Hsu&#39;s Link-Hub","dataI18nAlt":"text-repo-of-steve-hsu-s-link-hub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/github.webp","dataColorVar":"bs-body-color"}'
          >
            <i class="bi bi-github"></i>
          </a>
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
