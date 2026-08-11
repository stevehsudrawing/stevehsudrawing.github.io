<!--
  TypeAwareLink.vue — Smart link with type-aware behavior.
  Renders an <a> tag with the .link class and delegates click
  handling based on type:

    external  -> openExternalLink()  (provided by App.vue)
    internal  -> router.push(href)   (Vue Router SPA navigation)
    email     -> native <a href="mailto:..."> behavior
    anchor    -> smooth-scroll to #hash target

  Always carries the .link class for hover-underline styling.
-->
<script setup lang="ts">
import { computed, inject } from "vue";
import { useRouter } from "vue-router";
import { scrollToHashTarget } from "../../platform/accessibility";
import { OPEN_EXTERNAL_LINK_KEY } from "../../types/app";
import type {
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../../types/app";

// =========================================================================
// Types
// =========================================================================

/** Signature of the openExternalLink function provided by App.vue. */
type OpenExternalLinkFn = (
  url: string,
  pictureProps: FeatureAwarePictureProps | null,
  coloredProps: ColoredImgProps | null,
  hideQR: boolean,
) => void;

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Target URL. */
  href: string;
  /** Link type — determines click behavior. */
  type: "external" | "internal" | "email" | "anchor";
  /** Optional FeatureAwarePicture props for the ExternalLinkConfirmModal. */
  pictureProps?: FeatureAwarePictureProps | null;
  /** Optional ColoredImg props for the ExternalLinkConfirmModal. */
  coloredProps?: ColoredImgProps | null;
  /** Hide the QR-code button in ExternalLinkConfirmModal. */
  noQRCode?: boolean;
  /** Hide the type indicator icon (arrow / envelope / paragraph). */
  hideIndicator?: boolean;
}>();

// =========================================================================
// Inject
// =========================================================================

const router = useRouter();
const openExternalLink = inject<OpenExternalLinkFn | undefined>(
  OPEN_EXTERNAL_LINK_KEY,
  undefined,
);

// =========================================================================
// State
// =========================================================================

/** Show ↗ arrow icon for external links (unless hidden). */
const showExternalIcon = computed(
  () => props.type === "external" && !props.hideIndicator,
);

/** Show ✉ envelope icon for email links (unless hidden). */
const showEmailIcon = computed(
  () => props.type === "email" && !props.hideIndicator,
);

/** Show ¶ paragraph icon for anchor links (unless hidden). */
const showAnchorIcon = computed(
  () => props.type === "anchor" && !props.hideIndicator,
);

// =========================================================================
// Actions
// =========================================================================

function onClick(e: MouseEvent): void {
  // Pass through modifier keys and non-left-click
  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  if (e.button !== 0) return;

  if (props.type === "internal") {
    e.preventDefault();
    router.push(props.href);
  } else if (props.type === "anchor") {
    e.preventDefault();
    scrollToHashTarget(props.href);
  } else if (props.type === "external" && openExternalLink) {
    e.preventDefault();
    // QR is shown only when icon props are provided AND noQRCode is
    // not explicitly true (default: hide QR).
    const hasIcon = !!(props.pictureProps || props.coloredProps);
    const hideQR = props.noQRCode !== false || !hasIcon;
    openExternalLink(
      props.href,
      props.pictureProps ?? null,
      props.coloredProps ?? null,
      hideQR,
    );
  }
  // email: native browser behavior
}
</script>

<template>
  <a
    :href="href"
    class="link"
    :class="{
      'external-link': type === 'external',
      'internal-link': type === 'internal',
    }"
    :target="type === 'external' ? '_blank' : undefined"
    :rel="type === 'external' ? 'noopener noreferrer' : undefined"
    :data-no-qr-code="noQRCode ? '' : undefined"
    @click="onClick"
  >
    <slot />
    <i v-if="showExternalIcon" class="bi bi-arrow-up-right link-indicator"></i>
    <i v-if="showAnchorIcon" class="bi bi-paragraph link-indicator"></i>
    <i v-if="showEmailIcon" class="bi bi-envelope link-indicator"></i>
  </a>
</template>

<style scoped>
.link-indicator {
  font-size: 0.6rem;
  vertical-align: top;
  transform: translateX(-0.1rem);
}
</style>
