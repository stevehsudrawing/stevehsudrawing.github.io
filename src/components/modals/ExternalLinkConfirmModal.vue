<!--
  ExternalLinkConfirmModal.vue — External link safety check.
  Props + visibility come from the shared modal stack (useStackModal).
  Cancel pops one level (back to the previous modal, if any);
  backdrop / Esc clears the whole stack.
-->
<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { useStoredValue } from "../../composables/useStoredValue";
import {
  getStoredOpenInNewTab,
  setStoredOpenInNewTab,
} from "../../platform/storage";
import type { TypeAwareImageProps } from "../../types/app";
import CopyButton from "../buttons/CopyButton.vue";
import TypeAwareImage from "../images/TypeAwareImage.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

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
const icon = computed<TypeAwareImageProps | null>(
  () => stackProps.value?.icon ?? null,
);
const hideQRButton = computed(() => stackProps.value?.hideQR ?? false);

/** Alt text for the icon. */
const iconAlt = computed(() => icon.value?.imgProps.alt ?? t("text-link"));

/** Icon with the resolved alt injected (ColoredImg requires alt). */
const displayIcon = computed<TypeAwareImageProps | null>(() => {
  const i = icon.value;
  if (!i) return null;
  if (i.type === "picture") {
    return {
      type: "picture",
      imgProps: { ...i.imgProps, alt: iconAlt.value },
    };
  }
  return {
    type: "colored-img",
    imgProps: { ...i.imgProps, alt: iconAlt.value },
  };
});

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
      icon: icon.value,
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
      <div v-if="displayIcon" class="link-icon-wrapper me-2">
        <TypeAwareImage
          :image="displayIcon"
          :width="32"
          :height="32"
          class="img-fluid"
        />
      </div>
      <code class="d-block p-2 flex-grow-1 user-select-all">{{ url }}</code>
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
