<!--
  TypeAwareLink.vue — Smart link with type-aware behavior.
  Renders an <a> tag with the .link class and delegates click
  handling based on type:

    external  -> openExternalLinkConfirmModal() (useExternalLinkConfirmModal)
    internal  -> router.push(href)   (Vue Router SPA navigation)
    email     -> native <a href="mailto:..."> behavior
    anchor    -> smooth-scroll to #hash target

  Carries the .link class for the sweeping hover underline (base.css:
  grows from the left, retreats toward the right on leave) unless
  `noUnderline` is set — button-styled links (`btn`) opt out.
-->
<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useExternalLinkConfirmModal } from "../../composables/modals/useExternalLinkConfirmModal";
import { scrollToHashTarget } from "../../platform/accessibility";
import type { TypeAwareLinkProps } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<TypeAwareLinkProps>();

// =========================================================================
// State
// =========================================================================

const router = useRouter();
const { openExternalLinkConfirmModal } = useExternalLinkConfirmModal();

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
  } else if (props.type === "external") {
    e.preventDefault();
    // QR is shown only when an icon is provided AND noQRCode is
    // not explicitly true (default: hide QR).
    const hasIcon = !!props.icon;
    const hideQR = props.noQRCode !== false || !hasIcon;
    openExternalLinkConfirmModal({
      url: props.href,
      icon: props.icon ?? null,
      hideQR,
    });
  }
  // email: native browser behavior
}
</script>

<template>
  <a
    :href="href"
    :class="{
      link: !noUnderline,
      'external-link': type === 'external',
      'internal-link': type === 'internal',
    }"
    :target="type === 'external' ? '_blank' : undefined"
    :rel="type === 'external' ? 'noopener noreferrer' : undefined"
    :data-no-qr-code="noQRCode ? '' : undefined"
    @click="onClick"
  >
    <slot />
    <MaterialSymbol
      v-if="showExternalIcon"
      name="arrow_outward"
      class="link-indicator"
    />
    <MaterialSymbol
      v-if="showAnchorIcon"
      name="format_paragraph"
      class="link-indicator"
    />
    <MaterialSymbol v-if="showEmailIcon" name="mail" class="link-indicator" />
  </a>
</template>

<style scoped>
.link-indicator {
  font-size: 0.6rem;
  vertical-align: top;
  transform: translateX(-0.1rem);
}
</style>
