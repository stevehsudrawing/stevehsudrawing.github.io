<!--
  FooterNav.vue -- site footer with copyright, external links, and QR share trigger.

  Replaces build/page-components/footer.html.
  Links use data-link-img-props / data-qr-url for App.vue event delegation.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { toHtml } from "hast-util-to-html";

// =========================================================================
// State
// =========================================================================

const { t, messages } = useI18n();

// -------------------------------------------------------------------------
// HAST-powered-by
// -------------------------------------------------------------------------

/** Render a HAST-format i18n key to HTML. */
function renderHast(key: string, fallback: unknown): string {
  const node = messages.value[key] ?? fallback;
  if (node && typeof node === "object") {
    return toHtml(node as Parameters<typeof toHtml>[0]);
  }
  return "";
}

const poweredByHtml = computed(() => renderHast("hast-powered-by", null));

// =========================================================================
// Actions
// =========================================================================
// (none -- footer links use App.vue event delegation)
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
        </div>

        <!-- ==== Powered by ==== -->
        <div>
          <span v-html="poweredByHtml"></span>
        </div>

        <!-- ==== Issue + Copyright links ==== -->
        <div class="d-flex gap-2">
          <a
            class="link external-link text-nowrap"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io/issues"
            data-link-img-props='{"alt":"GitHub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/github.webp","dataColorVar":"bs-body-color"}'
            data-no-qr-code
          >
            {{ $t("text-report-an-issue", "Report an Issue") }}
          </a>
          <a
            class="link external-link text-nowrap"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io/blob/main/public/images/README.md"
            data-link-img-props='{"alt":"GitHub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/github.webp","dataColorVar":"bs-body-color"}'
            data-no-qr-code
          >
            {{ $t("text-artwork-copyright", "Artwork Copyright") }}
          </a>
        </div>

        <!-- ==== Share + View Code ==== -->
        <div class="ms-auto d-flex gap-2">
          <a
            class="link text-nowrap"
            href="javascript:void(0)"
            role="button"
            data-qr-url="https://stevehsudrawing.github.io"
            data-qr-icon='{"alt":"Steve Hsu&#39;s Link-Hub","dataI18nAlt":"text-steve-hsu-s-link-hub","src":"/images/webp/null.webp","dataImgFeature":"colored","dataSrcMask":"/images/webp/icons/steve-hsu.webp","dataColorVar":"bs-primary"}'
            :aria-label="$t('text-share-this-website', 'Share this website!')"
            v-b-tooltip="$t('text-share-this-website', 'Share this website!')"
            data-no-open-link
          >
            <i class="bi bi-share-fill"></i>
          </a>
          <a
            class="link external-link text-nowrap"
            href="https://github.com/stevehsudrawing/stevehsudrawing.github.io"
            :aria-label="$t('text-view-code', 'View Code')"
            v-b-tooltip="$t('text-view-code', 'View Code')"
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
