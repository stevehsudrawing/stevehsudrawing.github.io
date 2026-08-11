<!--
  ExternalLinkConfirmModal.vue — External link safety check.
  Receives typed pictureProps / coloredProps directly from App.vue
  via provide/inject pipeline — no HAST round-trip needed.
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useLocalStorage } from "../../composables/useLocalStorage";
import { StorageKey } from "../../types/app";
import type {
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../../types/app";
import { useModalFocus } from "../../composables/useModalFocus";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import CopyButton from "../buttons/CopyButton.vue";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import ColoredImg from "../ui/ColoredImg.vue";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  url: string;
  pictureProps?: FeatureAwarePictureProps | null;
  coloredProps?: ColoredImgProps | null;
  hideQRButton?: boolean;
}>();

// =========================================================================
// Emits
// =========================================================================

const emit = defineEmits<{
  (e: "navigate", url: string, openInNewTab: boolean): void;
  (
    e: "show-qr",
    url: string,
    pictureProps: FeatureAwarePictureProps | null,
    coloredProps: ColoredImgProps | null,
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

/** Alt text for the icon. */
const iconAlt = computed(
  () =>
    props.pictureProps?.alt ??
    props.coloredProps?.alt ??
    t("text-link", "Link"),
);

// =========================================================================
// Actions
// =========================================================================

function confirm(): void {
  emit("navigate", props.url, openInNewTab.value);
  visible.value = false;
}

function showQR(): void {
  emit(
    "show-qr",
    props.url,
    props.pictureProps ?? null,
    props.coloredProps ?? null,
  );
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
      <div v-if="coloredProps" class="link-icon-wrapper me-2">
        <ColoredImg
          :src="coloredProps.src"
          :color-var="coloredProps.colorVar"
          :alt="iconAlt"
          :width="32"
          :height="32"
          class="img-fluid"
        />
      </div>
      <div v-else-if="pictureProps" class="link-icon-wrapper me-2">
        <FeatureAwarePicture
          :src="pictureProps.src"
          :src-map="pictureProps.srcMap"
          :feature="pictureProps.feature"
          :alt="iconAlt"
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
        <TooltipTrigger :title="t('text-show-qr-code', 'Show QR Code')">
          <button
            v-if="!hideQRButton"
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-show-qr-code', 'Show QR Code')"
            @click="showQR"
          >
            <i class="bi bi-qr-code"></i>
          </button>
        </TooltipTrigger>
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
