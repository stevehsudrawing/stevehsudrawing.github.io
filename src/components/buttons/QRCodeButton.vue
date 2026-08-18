<!--
  QRCodeButton.vue — Standalone QR-code trigger button.
  Opens QRCodeModal via inject(OPEN_QR_CODE_KEY) on click.
  Default slot shows bi-qr-code; override for custom icon (e.g. bi-share-fill).
-->
<script setup lang="ts">
import { inject } from "vue";
import { useI18n } from "../../composables/useI18n";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import type { TypeAwareImageProps } from "../../types/app";
import { OPEN_QR_CODE_KEY } from "../../types/app";

// =========================================================================
// Types
// =========================================================================

type OpenQRCodeFn = (
  url: string,
  icon: TypeAwareImageProps | null,
  hideOpenLink?: boolean,
) => void;

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
// Inject
// =========================================================================

const { t } = useI18n();
const openQRCode = inject<OpenQRCodeFn | undefined>(
  OPEN_QR_CODE_KEY,
  undefined,
);

// =========================================================================
// Actions
// =========================================================================

function onClick(e: MouseEvent): void {
  if (openQRCode) {
    e.preventDefault();
    openQRCode(props.url, props.icon ?? null, props.hideOpenLink);
  }
}
</script>

<template>
  <TooltipTrigger :title="t('text-show-qr-code')">
    <a
      href="javascript:void(0)"
      role="button"
      class="text-decoration-none"
      :aria-label="$t('text-show-qr-code')"
      @click="onClick"
    >
      <i v-if="!$slots.default" class="bi bi-qr-code"></i>
      <slot />
    </a>
  </TooltipTrigger>
</template>
