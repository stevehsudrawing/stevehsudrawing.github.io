<!--
  LinkButton.vue — Single link button with icon and tooltip.
  Renders one LinkButtonData item from the link-button-groups JSON config.
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps";
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import type { LinkButtonData, FeatureAwareImgProps } from "../../types/app";
import type { HastProperties } from "../../types/hast";

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

/** HAST properties -> FeatureAwareImg display props. */
const imgDisplay = useImgDisplayProps(
  computed(() => displayIconProps.value as HastProperties),
);

// ---- Link attributes ----

/** CSS classes for the button link. */
const btnClass = computed(() =>
  primary ? "btn-primary" : "btn-outline-secondary",
);

/** FeatureAwareImgProps for TypeAwareLink's modal icon. */
const typeAwareImgProps = computed<FeatureAwareImgProps | null>(() => {
  if (!externalLink) return null;
  return {
    lightSrc: (iconProps.src as string) ?? "",
    alt: (iconProps.alt as string) ?? "",
    feature: (iconProps.dataImgFeature as string) ?? undefined,
    colorMaskSrc: (iconProps.dataSrcMask as string) ?? undefined,
    colorVar: (iconProps.dataColorVar as string) ?? undefined,
  };
});

/** Tooltip title: prefer i18n alt, fall back to plain alt. */
const tooltipTitle = computed(() => {
  const i18nKey = iconProps.dataI18nAlt as string | undefined;
  return i18nKey
    ? t(i18nKey, iconProps.alt as string)
    : (iconProps.alt as string);
});
</script>

<template>
  <TooltipTrigger :title="tooltipTitle" teleport>
    <TypeAwareLink
      :type="externalLink ? 'external' : 'internal'"
      :href="linkHref"
      :img-props="typeAwareImgProps"
      :no-qr-code="!externalLink || undefined"
      :class="['btn', btnClass, 'link-btn-img-wrapper']"
      :aria-label="tooltipTitle"
      hide-indicator
    >
      <FeatureAwareImg
        :light-src="(imgDisplay.src.value as string) ?? ''"
        :alt="(imgDisplay.alt.value as string) ?? ''"
        :feature="imgDisplay.feature.value"
        :color-var="imgDisplay.colorVar.value"
        :color-mask-src="imgDisplay.colorMaskSrc.value"
        :width="40"
        :height="40"
      />
    </TypeAwareLink>
  </TooltipTrigger>
</template>

<style scoped>
.btn {
  --bs-btn-padding-x: 0.75rem;
  --bs-btn-padding-y: 0.5rem;
}

.link-btn-img-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.btn-outline-secondary {
  --bs-btn-hover-color: #6c757d;
  --bs-btn-hover-bg: rgba(108, 117, 125, 0.2);
  --bs-btn-active-color: #6c757d;
  --bs-btn-active-bg: rgba(108, 117, 125, 0.2);
}
</style>
