<!--
  ExternalLinkConfirmModal.vue — External link safety check.
  Replaces features/external-link-confirmation.ts DOM state hacks
  (_confirmUrl, _confirmIconProps) with clean props + emits.
-->
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useI18n } from "../../composables/useI18n.js";
import { useLocalStorage } from "../../composables/useLocalStorage.js";
import { useToast } from "../../composables/useToast.js";
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
 * - navigate: User confirmed \"Open\" — parent navigates to the URL.
 * - show-qr: User clicked \"Show QR Code\" — parent switches to QRCodeModal.
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
const openInNewTab = useLocalStorage("openExternalLinksInNewTab", true);
const { t } = useI18n();
const { showToast } = useToast();

// Re-render icon when imgProperties changes
const iconSrc = computed(() => {
  if (props.imgProperties?.src) {
    return props.imgProperties.src as string;
  }
  return null;
});

const iconAlt = computed(() => {
  if (props.imgProperties?.alt) {
    return props.imgProperties.alt as string;
  }
  return t("text-link", "Link");
});

const iconFeature = computed(() => {
  if (props.imgProperties?.dataImgFeature) {
    return props.imgProperties.dataImgFeature as string;
  }
  return undefined;
});

const iconColorVar = computed(() => {
  if (props.imgProperties?.dataColorVar) {
    return props.imgProperties.dataColorVar as string;
  }
  return undefined;
});

const iconColorMaskSrc = computed(() => {
  if (props.imgProperties?.dataSrcMask) {
    return props.imgProperties.dataSrcMask as string;
  }
  return undefined;
});

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

async function copyUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.url);
    showToast(
      "success",
      `${t("text-copied-text", "Copied text")}: ${props.url}`,
    );
  } catch {
    showToast("error", "Failed to copy URL");
  }
}

/** Expose show/hide for imperative callers (parent App.vue). */
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
      <FeatureAwareImg
        v-if="iconSrc"
        :light-src="iconSrc"
        :alt="iconAlt"
        :feature="iconFeature"
        :color-var="iconColorVar"
        :color-mask-src="iconColorMaskSrc"
        :width="32"
        :height="32"
        class="me-2 img-fluid"
      />
      <code class="d-block bg-body-tertiary p-2 flex-grow-1">{{ url }}</code>
    </div>

    <BFormCheckbox id="ext-link-new-tab-toggle" v-model="openInNewTab" switch>
      {{ $t("text-open-in-new-tab", "Open in new tab") }}
    </BFormCheckbox>

    <template #footer>
      <div class="w-100 d-flex gap-1">
        <button
          v-if="!hideQRButton"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-show-qr-code', 'Show QR Code')"
          v-b-tooltip="t('text-show-qr-code', 'Show QR Code')"
          @click="showQR"
        >
          <i class="bi bi-qr-code"></i>
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border me-auto"
          :aria-label="$t('text-copy', 'Copy')"
          v-b-tooltip="t('text-copy', 'Copy')"
          @click="copyUrl"
        >
          <i class="bi bi-clipboard"></i>
        </button>
        <button
          type="button"
          class="btn btn-outline-secondary btn-no-border"
          @click="visible = false"
        >
          {{ $t("text-cancel", "Cancel") }}
        </button>
        <button
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
