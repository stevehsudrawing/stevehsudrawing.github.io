<!--
  ExternalLinkConfirmModal.vue — External link safety check.
  Props + visibility come from the shared modal stack (useStackModal).
  Cancel pops one level (back to the previous modal, if any);
  backdrop / Esc clears the whole stack.
-->
<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useStoredValue } from "../../composables/useStoredValue";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import {
  getStoredOpenInNewTab,
  setStoredOpenInNewTab,
} from "../../platform/storage";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import CopyButton from "../buttons/CopyButton.vue";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import ColoredImg from "../ui/ColoredImg.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("external-link");
const { push, pop, clear } = useModalStack();

const openInNewTab = useStoredValue(
  getStoredOpenInNewTab,
  setStoredOpenInNewTab,
  true,
);
const { t } = useI18n();

/** Open-button element for keyboard auto-focus. */
const openBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Open button when opened via Tab. */
const { onShown } = useModalFocus(openBtnRef);

// ---- Derived (narrowed from the stack entry) ----

const url = computed(() => stackProps.value?.url ?? "");
const pictureProps = computed(() => stackProps.value?.pictureProps ?? null);
const coloredProps = computed(() => stackProps.value?.coloredProps ?? null);
const hideQRButton = computed(() => stackProps.value?.hideQR ?? false);

/** Alt text for the icon. */
const iconAlt = computed(
  () => pictureProps.value?.alt ?? coloredProps.value?.alt ?? t("text-link"),
);

// =========================================================================
// Actions
// =========================================================================

function confirm(): void {
  if (openInNewTab.value) {
    window.open(url.value, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url.value;
  }
  clear();
}

function showQR(): void {
  push({
    id: "qr-code",
    props: {
      url: url.value,
      pictureProps: pictureProps.value,
      coloredProps: coloredProps.value,
      hideOpenLink: false,
    },
  });
}
</script>

<template>
  <BModal
    v-model="visible"
    :title="$t('text-external-link')"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <p class="mb-2">
      {{ $t("text-you-are-about-to-leave") }}
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
      {{ $t("text-open-in-new-tab") }}
    </BFormCheckbox>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-show-qr-code')">
          <button
            v-if="!hideQRButton"
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-show-qr-code')"
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
          @click="pop()"
        >
          {{ $t("text-cancel") }}
        </button>
        <button
          ref="openBtnRef"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="confirm"
        >
          {{ $t("text-open") }}
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
