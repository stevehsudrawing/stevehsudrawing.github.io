<!--
  WorldviewPage.vue — Internationalized worldview / character-settings page.
  Renders the per-language worldview.md (selected reactively by
  useMarkdownContent) via the reusable MarkdownArticle component.
-->
<script setup lang="ts">
import { computed } from "vue";
import PageChainNav from "../components/nav/PageChainNav.vue";
import HeroSection from "../components/ui/HeroSection.vue";
import MarkdownArticle from "../components/ui/MarkdownArticle.vue";
import { useMarkdownContent } from "../composables/content/useMarkdownContent";
import { useI18n } from "../composables/core/useI18n";
import { usePictureRegistry } from "../composables/pictures/usePictureRegistry";
import { isBirthdayWeek } from "../core/birthday";

// Picture registry — resolves the hero cover props.
const { pictureProps } = usePictureRegistry();

// =========================================================================
// Birthday-week hero cover
// =========================================================================

/** Cover index: `worldview-1` during the birthday week, else `worldview-0`. */
const coverIndex = computed(() => (isBirthdayWeek() ? "1" : "0"));

const { t } = useI18n();

/**
 * Cover title passed to the lightbox — a language-neutral literal for
 * the regular cover (the codename), i18n text for the birthday cover.
 */
const coverTitle = computed(() =>
  coverIndex.value === "1" ? t("text-worldview-1-title") : "CODENAME",
);

/** Cover message shown under the picture by the lightbox. */
const coverMessage = computed(() =>
  t(`text-worldview-${coverIndex.value}-message`),
);

// =========================================================================
// Markdown content (per-language raw import, reactive to language)
// =========================================================================

const { content } = useMarkdownContent("worldview");
</script>

<template>
  <!-- ==== Hero section ==== -->
  <HeroSection
    :title="$t('text-worldview')"
    :description="$t('text-worldview-description')"
    :image="
      pictureProps(`worldview-${coverIndex}`, {
        title: coverTitle,
        message: coverMessage,
        showAltButton: true,
        previewable: true,
        class: 'solid-bg',
      })
    "
  />

  <PageChainNav page-name="worldview" />

  <hr />

  <!-- ==== Markdown content with built-in scrollspy ==== -->
  <MarkdownArticle
    :content="content"
    page-path="/worldview.html"
    class="no-copy"
  />
</template>
