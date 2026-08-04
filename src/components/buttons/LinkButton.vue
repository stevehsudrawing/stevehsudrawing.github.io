<!--
  LinkButton.vue -- Single link button with icon and tooltip.
  Renders one LinkButtonData item from the link-button-groups JSON config.

  Phase 7: replaces build/builders/link-button-groups.ts buildButtonNode().
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps.js";
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";
import type { LinkButtonData } from "../../types/app.js";
import type { HastProperties } from "../../types/hast.js";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Button data from JSON config. */
  button: LinkButtonData;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { iconProps, externalLink, linkHref, primary } = props.button;

// ---- Display icon (transformed for primary buttons) ----

/**
 * For primary buttons, transform iconProps so the icon is displayed
 * as a colored mask tinted with shlh-primary-color (visible on the
 * btn-primary background).  Non-primary buttons use iconProps as-is.
 */
const displayIconProps = computed<Record<string, unknown>>(() => {
  if (!primary) return { ...iconProps };

  const srcMask =
    iconProps.dataImgFeature === "colored" && iconProps.dataSrcMask
      ? iconProps.dataSrcMask
      : iconProps.src;

  const result: Record<string, unknown> = {
    alt: iconProps.alt,
    src: "/images/webp/null.webp",
    dataImgFeature: "colored",
    dataSrcMask: srcMask,
    dataColorVar: "shlh-primary-color",
  };

  if (iconProps.dataI18nAlt) result.dataI18nAlt = iconProps.dataI18nAlt;
  if (iconProps.className) result.className = iconProps.className;

  return result;
});

/** HAST properties → FeatureAwareImg display props. */
const imgDisplay = useImgDisplayProps(
  computed(() => displayIconProps.value as HastProperties),
);

// ---- Link attributes ----

/** CSS classes for the button link. */
const btnClass = computed(() =>
  primary ? "btn-primary" : "btn-outline-secondary",
);

/** Link type class: internal-link or external-link. */
const linkClass = computed(() =>
  externalLink ? "external-link" : "internal-link",
);

/** JSON-encoded original iconProps for external-link confirmation modal. */
const linkImgProps = computed(() =>
  externalLink ? JSON.stringify(iconProps) : undefined,
);

/** Whether to suppress QR code (non-external links don't get QR). */
const noQR = computed(() => !externalLink || undefined);

/** Tooltip title: prefer i18n alt, fall back to plain alt. */
const tooltipTitle = computed(() => {
  const i18nKey = iconProps.dataI18nAlt as string | undefined;
  return i18nKey
    ? t(i18nKey, iconProps.alt as string)
    : (iconProps.alt as string);
});

// ---- Bootstrap Tooltip (manual — v-b-tooltip directive fails on root <a>) ----

const btnRef = ref<HTMLAnchorElement>();

onMounted(() => {
  if (btnRef.value && tooltipTitle.value) {
    new window.bootstrap.Tooltip(btnRef.value, {
      title: tooltipTitle.value,
    });
  }
});

/** Update tooltip title after language switch. */
watch(tooltipTitle, (newTitle) => {
  if (btnRef.value) {
    const instance = window.bootstrap.Tooltip.getInstance(btnRef.value);
    if (instance) {
      instance.setContent({ ".tooltip-inner": newTitle });
    }
  }
});

onUnmounted(() => {
  if (btnRef.value) {
    const instance = window.bootstrap.Tooltip.getInstance(btnRef.value);
    if (instance) instance.dispose();
  }
});
</script>

<template>
  <a
    ref="btnRef"
    :class="['btn', btnClass, 'link-btn-img-wrapper', linkClass]"
    :href="linkHref"
    :data-link-img-props="linkImgProps"
    :data-no-qr-code="noQR"
    :aria-label="tooltipTitle"
  >
    <FeatureAwareImg
      :light-src="(imgDisplay.src.value as string) ?? ''"
      :alt="(imgDisplay.alt.value as string) ?? ''"
      :feature="imgDisplay.feature.value"
      :color-var="imgDisplay.colorVar.value"
      :color-mask-src="imgDisplay.colorMaskSrc.value"
    />
  </a>
</template>
