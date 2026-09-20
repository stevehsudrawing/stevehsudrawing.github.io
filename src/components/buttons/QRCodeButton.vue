<!--
  QRCodeButton.vue — Standalone QR-code trigger button.
  Opens QRCodeModal via useQRCodeModal() on click.
  Default slot shows the `qr_code` icon; override with a custom
  MaterialSymbol (e.g. `share` with `fill`).
-->
<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";
import { useQRCodeModal } from "../../composables/useQRCodeModal";
import type { TypeAwareImageProps } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** URL to encode in the QR code. */
  url: string;
  /** Optional icon for the QR overlay (picture or colored). */
  icon?: TypeAwareImageProps | null;
  /** Hide the "Open Link" button in the QRCodeModal. */
  hideOpenLink?: boolean;
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const { openQRCodeModal } = useQRCodeModal();

// =========================================================================
// Actions
// =========================================================================

function onClick(e: MouseEvent): void {
  e.preventDefault();
  openQRCodeModal({
    url: props.url,
    icon: props.icon ?? null,
    hideOpenLink: props.hideOpenLink,
  });
}
</script>

<template>
  <TooltipTrigger :title="t('text-show-qr-code')">
    <a
      role="button"
      class="text-decoration-none"
      :aria-label="$t('text-show-qr-code')"
      @click="onClick"
    >
      <MaterialSymbol v-if="!$slots.default" name="qr_code" />
      <slot />
    </a>
  </TooltipTrigger>
</template>
