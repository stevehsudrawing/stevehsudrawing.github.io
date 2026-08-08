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
import { computed, inject, useSlots, Text } from "vue";
import { useRouter } from "vue-router";
import { scrollToHashTarget } from "../../platform/accessibility";
import type { FeatureAwareImgProps } from "../../types/app";
import { OPEN_EXTERNAL_LINK_KEY } from "../../types/app";

// =========================================================================
// Types
// =========================================================================

/** Signature of the openExternalLink function provided by App.vue. */
type OpenExternalLinkFn = (
  url: string,
  imgProps: FeatureAwareImgProps | null,
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
  /** Optional icon props for the ExternalLinkConfirmModal. */
  imgProps?: FeatureAwareImgProps | null;
  /** Hide the QR-code button in ExternalLinkConfirmModal. */
  noQRCode?: boolean;
}>();

// =========================================================================
// Inject
// =========================================================================

const router = useRouter();
const slots = useSlots();
const openExternalLink = inject<OpenExternalLinkFn | undefined>(
  OPEN_EXTERNAL_LINK_KEY,
  undefined,
);

// =========================================================================
// State
// =========================================================================

/**
 * Check whether the default slot VNodes contain any visible text.
 * Used to suppress the external-link arrow on image-only links
 * (e.g. carousel slides).
 */
function slotHasText(): boolean {
  const children = slots.default?.() as
    (string | Record<string, unknown>)[] | undefined;
  if (!children) return false;
  return children.some((v) => {
    if (typeof v === "string") return (v as string).trim().length > 0;
    if (typeof v === "object" && v != null) {
      const vn = v as Record<string, unknown>;
      if (vn.type === Text) {
        const textChildren = vn.children as string | undefined;
        return (
          typeof textChildren === "string" && textChildren.trim().length > 0
        );
      }
      const vnodeChildren = vn.children;
      if (Array.isArray(vnodeChildren)) {
        return (vnodeChildren as unknown[]).some(
          (c) => typeof c === "string" && (c as string).trim().length > 0,
        );
      }
    }
    return false;
  });
}

/** Show ↗ arrow icon for external links that contain visible text. */
const showExternalIcon = computed(
  () => props.type === "external" && slotHasText(),
);

/** Show ✉ envelope icon for email links. */
const showEmailIcon = computed(() => props.type === "email");

/** Show ¶ paragraph icon for anchor links. */
const showAnchorIcon = computed(() => props.type === "anchor");

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
    // QR is shown only when imgProps is provided AND noQRCode is
    // not explicitly true (default: hide QR).
    const hideQR = props.noQRCode !== false || !props.imgProps;
    openExternalLink(props.href, props.imgProps ?? null, hideQR);
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
