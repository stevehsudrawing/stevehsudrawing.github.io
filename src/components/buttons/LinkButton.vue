<!--
  LinkButton.vue — Single link button with icon and tooltip.
  Renders one LinkButtonData item from the link-button-groups JSON config.
-->
<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import ColoredImg from "../ui/ColoredImg.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import type {
  LinkButtonData,
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../../types/app";
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

/** HAST properties -> ColoredImg / FeatureAwarePicture display props. */
const imgDisplay = useImgDisplayProps(
  computed(() => displayIconProps.value as HastProperties),
);

/**
 * HAST properties from the original iconProps (not display-transformed).
 * Used for modal pass-through — the modal should reflect the original
 * icon, not the primary-button tint transform.
 */
const modalImgDisplay = useImgDisplayProps(
  computed(() => ({ ...iconProps }) as HastProperties),
);

// ---- Link attributes ----

/** CSS classes for the button link. */
const btnClass = computed(() =>
  primary ? "btn-primary" : "btn-outline-secondary",
);

/** ColoredImg props for TypeAwareLink's modal (colored icons). */
const modalColoredProps = computed<ColoredImgProps | null>(() => {
  if (!externalLink || !modalImgDisplay.isColored.value) return null;
  return {
    src: modalImgDisplay.colorMaskSrc.value ?? modalImgDisplay.src.value ?? "",
    colorVar: modalImgDisplay.colorVar.value ?? "shlh-primary-color",
    alt: modalImgDisplay.alt.value ?? "",
  };
});

/** FeatureAwarePicture props for TypeAwareLink's modal (non-colored icons). */
const modalPictureProps = computed<FeatureAwarePictureProps | null>(() => {
  if (!externalLink || modalImgDisplay.isColored.value) return null;
  return {
    src: modalImgDisplay.src.value ?? "",
    alt: modalImgDisplay.alt.value ?? "",
    feature: modalImgDisplay.feature.value,
  };
});

/** Tooltip title: prefer the i18n alt; plain alt otherwise. */
const tooltipTitle = computed(() => {
  const i18nKey = iconProps.dataI18nAlt as string | undefined;
  return i18nKey ? t(i18nKey) : (iconProps.alt as string);
});
</script>

<template>
  <TooltipTrigger :title="tooltipTitle" teleport>
    <TypeAwareLink
      :type="externalLink ? 'external' : 'internal'"
      :href="linkHref"
      :picture-props="modalPictureProps"
      :colored-props="modalColoredProps"
      :no-qr-code="!externalLink || undefined"
      :class="['btn', btnClass, 'link-btn-img-wrapper']"
      :aria-label="tooltipTitle"
      hide-indicator
    >
      <ColoredImg
        v-if="imgDisplay.isColored.value"
        :src="
          (imgDisplay.colorMaskSrc.value as string) ??
          (imgDisplay.src.value as string) ??
          ''
        "
        :color-var="
          (imgDisplay.colorVar.value as string) ?? 'shlh-primary-color'
        "
        :alt="(imgDisplay.alt.value as string) ?? ''"
        :width="40"
        :height="40"
      />
      <FeatureAwarePicture
        v-else
        :src="(imgDisplay.src.value as string) ?? ''"
        :alt="(imgDisplay.alt.value as string) ?? ''"
        :feature="imgDisplay.feature.value"
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
