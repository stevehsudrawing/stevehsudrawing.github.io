<!--
  ExternalLinkConfirmModal.vue -- External link safety check.
  Replaces features/external-link-confirmation.ts DOM state hacks
  (_confirmUrl, _confirmIconProps) with clean props + emits.
-->
<script setup lang="ts">
import { ref, computed, toRef, type Ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useLocalStorage } from "../../composables/useLocalStorage";
import { StorageKey } from "../../types/app";
import { useModalFocus } from "../../composables/useModalFocus";
import { useImgDisplayProps } from "../../composables/useImgDisplayProps";
import CopyButton from "../buttons/CopyButton.vue";
import FeatureAwareImg from "../ui/FeatureAwareImg.vue";

// =========================================================================
// Props
// =========================================================================

/**
 * Props for ExternalLinkConfirmModal.
 *
 * @property url - The external URL the user is about to navigate to.
 * @property imgProperties - Optional HAST-format icon properties
 *   (src, alt, dataImgFeature, etc.) rendered next to the URL.
 * @property hideQRButton - When true, the \"Show QR Code\" button is hidden.
 */
const props = defineProps<{
  url: string;
  imgProperties?: Record<string, unknown> | null;
  hideQRButton?: boolean;
}>();

/**
 * Emits for ExternalLinkConfirmModal.
 *
 * - navigate: User confirmed \"Open\" -- parent navigates to the URL.
 * - show-qr: User clicked \"Show QR Code\" -- parent switches to QRCodeModal.
 */
const emit = defineEmits<{
  (e: "navigate", url: string, openInNewTab: boolean): void;
  (
    e: "show-qr",
    url: string,
    imgProperties: Record<string, unknown> | null,
  ): void;
}>();

// =========================================================================
// State
// =========================================================================

const visible = ref(false);
const openInNewTab = useLocalStorage(StorageKey.OpenInNewTab, true);
const { t } = useI18n();

/** Open-button element for keyboard auto-focus. */
const openBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Open button when opened via Tab. */
const { onShown } = useModalFocus(openBtnRef);

// Extract display properties from HAST imgProperties
const {
  src: iconSrc,
  alt: iconAltRaw,
  feature: iconFeature,
  colorVar: iconColorVar,
  colorMaskSrc: iconColorMaskSrc,
} = useImgDisplayProps(
  toRef(props, "imgProperties") as Ref<
    Record<string, unknown> | null | undefined
  >,
);

const iconAlt = computed(() => iconAltRaw.value ?? t("text-link", "Link"));

// =========================================================================
// Actions
// =========================================================================

function confirm(): void {
  emit("navigate", props.url, openInNewTab.value);
  visible.value = false;
}

function showQR(): void {
  emit("show-qr", props.url, props.imgProperties ?? null);
  visible.value = false;
}

// =========================================================================
// Expose
// =========================================================================

defineExpose({
  show: () => {
    visible.value = true;
  },
  hide: () => {
    visible.value = false;
  },
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="$t('text-external-link', 'External Link')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <p class="mb-2">
      {{
        $t(
          "text-you-are-about-to-leave",
          "You are about to leave this site and go to:",
        )
      }}
    </p>

    <div class="d-flex align-items-start mb-3">
      <div v-if="iconSrc" class="link-icon-wrapper me-2">
        <FeatureAwareImg
          :light-src="iconSrc"
          :alt="iconAlt"
          :feature="iconFeature"
          :color-var="iconColorVar"
          :color-mask-src="iconColorMaskSrc"
          :width="32"
          :height="32"
          class="img-fluid"
        />
      </div>
      <code class="d-block p-2 flex-grow-1">{{ url }}</code>
    </div>

    <BFormCheckbox id="ext-link-new-tab-toggle" v-model="openInNewTab" switch>
      {{ $t("text-open-in-new-tab", "Open in new tab") }}
    </BFormCheckbox>

    <template #footer>
      <div class="w-100 d-flex">
        <button
          v-if="!hideQRButton"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-show-qr-code', 'Show QR Code')"
          v-b-tooltip="{
            title: t('text-show-qr-code', 'Show QR Code'),
            delay: { show: 500 },
          }"
          @click="showQR"
        >
          <i class="bi bi-qr-code"></i>
        </button>
        <CopyButton
          tag="button"
          class="btn btn-outline-primary btn-no-border me-auto"
          :copy-text="url"
        >
          <i class="bi bi-clipboard"></i>
        </CopyButton>
        <button
          type="button"
          class="btn btn-outline-secondary btn-no-border"
          @click="visible = false"
        >
          {{ $t("text-cancel", "Cancel") }}
        </button>
        <button
          ref="openBtnRef"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="confirm"
        >
          {{ $t("text-open", "Open") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
.link-icon-wrapper {
  min-width: 32px;
}
</style>
