<!--
  QRCodeButton.vue -- Standalone QR-code trigger button.
  Opens QRCodeModal via inject(OPEN_QR_CODE_KEY) on click.
  Default slot shows bi-qr-code; override for custom icon (e.g. bi-share-fill).
-->
<script setup lang="ts">
import { inject } from "vue";
import { useI18n } from "../../composables/useI18n";
import type { FeatureAwareImgProps } from "../../types/app";
import { OPEN_QR_CODE_KEY } from "../../types/app";

// =========================================================================
// Types
// =========================================================================

type OpenQRCodeFn = (
  url: string,
  imgProps: FeatureAwareImgProps | null,
  hideOpenLink?: boolean,
) => void;

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** URL to encode in the QR code. */
  url: string;
  /** Optional icon props for the QR overlay icon. */
  imgProps?: FeatureAwareImgProps | null;
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
    openQRCode(props.url, props.imgProps ?? null, props.hideOpenLink);
  }
}
</script>

<template>
  <a
    href="javascript:void(0)"
    role="button"
    class="text-decoration-none"
    :aria-label="$t('text-show-qr-code', 'Show QR Code')"
    v-b-tooltip="{
      title: t('text-show-qr-code', 'Show QR Code'),
      delay: { show: 500 },
    }"
    @click="onClick"
  >
    <i v-if="!$slots.default" class="bi bi-qr-code"></i>
    <slot />
  </a>
</template>
