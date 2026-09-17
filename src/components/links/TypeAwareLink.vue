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
import type { TypeAwareImageProps, TypeAwareLinkProps } from "../../types/app";
import { OPEN_EXTERNAL_LINK_KEY } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";

// =========================================================================
// Types
// =========================================================================

/** Signature of the openExternalLink function provided by App.vue. */
type OpenExternalLinkFn = (
  url: string,
  icon: TypeAwareImageProps | null,
  hideQR: boolean,
) => void;

// =========================================================================
// Props
// =========================================================================

const props = defineProps<TypeAwareLinkProps>();

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
    // QR is shown only when an icon is provided AND noQRCode is
    // not explicitly true (default: hide QR).
    const hasIcon = !!props.icon;
    const hideQR = props.noQRCode !== false || !hasIcon;
    openExternalLink(props.href, props.icon ?? null, hideQR);
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
