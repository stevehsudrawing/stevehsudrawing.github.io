<!--
  LinkButton.vue — Single link button with icon and tooltip.
  Renders one LinkButtonData item from the link-button-groups JSON config.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import TypeAwareImage from "../images/TypeAwareImage.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import type {
  LinkButtonData,
  TypeAwareImageProps,
  TypeAwareLinkProps,
} from "../../types/app";

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

// ---- Link attributes ----

const externalLink = computed(() => props.button.link.type === "external");

/** Link props for TypeAwareLink (the button's link). */
const linkProps = computed<TypeAwareLinkProps>(() => props.button.link);

/** CSS classes for the button link. */
const btnClass = computed(() =>
  props.button.primary ? "btn-primary" : "btn-outline-secondary",
);

// ---- Display icon (primary tint transform) ----

/**
 * For primary buttons, the icon is displayed as a colored mask tinted
 * with shlh-primary-color (visible on the btn-primary background).
 * Non-primary buttons use the icon as-is.  The id-derived alt is always
 * injected (ColoredImg requires alt).
 */
const displayIcon = computed<TypeAwareImageProps>(() => {
  const icon = props.button.icon;
  const baseAlt = icon.imgProps.alt ?? t("text-" + props.button.id);
  if (props.button.primary) {
    return {
      type: "colored-img",
      imgProps: {
        src: icon.imgProps.src ?? "",
        colorVar: "shlh-primary-color",
        alt: baseAlt,
      },
    };
  }
  if (icon.type === "picture") {
    return { type: "picture", imgProps: { ...icon.imgProps, alt: baseAlt } };
  }
  return { type: "colored-img", imgProps: { ...icon.imgProps, alt: baseAlt } };
});

/**
 * Icon passed to TypeAwareLink's confirmation modal (external links only).
 * The id-derived alt is injected so the modal shows a meaningful label.
 */
const modalIcon = computed<TypeAwareImageProps | null>(() => {
  if (!externalLink.value) return null;
  const icon = props.button.icon;
  const baseAlt = icon.imgProps.alt ?? t("text-" + props.button.id);
  if (icon.type === "picture") {
    return { type: "picture", imgProps: { ...icon.imgProps, alt: baseAlt } };
  }
  return { type: "colored-img", imgProps: { ...icon.imgProps, alt: baseAlt } };
});

/** Tooltip title derived from the button id. */
const tooltipTitle = computed(() => t("text-" + props.button.id));
</script>

<template>
  <TooltipTrigger :title="tooltipTitle" teleport>
    <TypeAwareLink
      v-bind="linkProps"
      :icon="modalIcon"
      :no-qr-code="!externalLink || undefined"
      :class="['btn', btnClass, 'link-btn-img-wrapper']"
      :aria-label="tooltipTitle"
      hide-indicator
    >
      <TypeAwareImage :image="displayIcon" :width="40" :height="40" />
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
