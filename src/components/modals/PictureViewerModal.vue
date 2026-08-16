<!--
  PictureViewerModal.vue — Lightbox for the Gallery page.
  Uses the standard BModal chrome (consistent with QRCodeModal): the header
  title shows the picture description; the footer has icon buttons on the
  left (prev / next / QR-share / related-link) and a text Close button on
  the right.  Navigation: footer buttons, keyboard arrows, and touch swipe
  over the image stage.  Preview-only: `.no-copy`, no download /
  open-original buttons.  Open/close animation + backdrop come from base.css
  (Modal / .modal-backdrop).
-->
<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "../../composables/useI18n";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { useHorizontalSwipe } from "../../composables/useHorizontalSwipe";
import { setSwipeTrackingEnabled } from "../../composables/useGesture";
import { preserveLangParam } from "../../core/utils";
import FeatureAwarePicture from "../ui/FeatureAwarePicture.vue";
import QRCodeButton from "../buttons/QRCodeButton.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../ui/TooltipTrigger.vue";
import type {
  DisplayPictureData,
  FeatureAwarePictureProps,
  ColoredImgProps,
} from "../../types/app";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("picture-viewer");
const { push, pop } = useModalStack();

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

/** Image stage (touch-swipe target). */
const stageRef = ref<HTMLElement | null>(null);

// -------------------------------------------------------------------------
// Current picture (initialized from currentId, then navigated internally)
// -------------------------------------------------------------------------

const contents = computed<DisplayPictureData[]>(
  () => stackProps.value?.contents ?? [],
);

const index = ref(0);

watch(
  stackProps,
  (p) => {
    if (p && p.contents?.length) {
      const idx = p.contents.findIndex((c) => c.id === p.currentId);
      index.value = idx >= 0 ? idx : 0;
    }
  },
  { immediate: true },
);

const current = computed<DisplayPictureData | null>(
  () => contents.value[index.value] ?? null,
);

const hasPrev = computed(() => index.value > 0);
const hasNext = computed(() => index.value < contents.value.length - 1);

// -------------------------------------------------------------------------
// Per-picture display props (single source of truth is `contents`)
// -------------------------------------------------------------------------

/** Enlarged poster props (alt falls back to t("text-" + id)). */
const pictureProps = computed<FeatureAwarePictureProps | null>(() => {
  const p = current.value;
  if (!p) return null;
  return {
    ...p.pictureProps,
    alt: p.pictureProps.alt ?? t("text-" + p.id),
  } as FeatureAwarePictureProps;
});

/** Description shown in the chrome bar. */
const title = computed(() =>
  current.value ? t("text-" + current.value.id) : "",
);

/**
 * QR centre icon — resolution: colored → picture → default signature.
 * NEVER the poster itself (keeps the full artwork out of the share card).
 */
const qrIconPictureProps = computed<FeatureAwarePictureProps | null>(() => {
  const p = current.value;
  if (!p || p.qrCodeIconColoredProps) return null;
  if (p.qrCodeIconPictureProps) {
    return {
      ...p.qrCodeIconPictureProps,
      alt: p.qrCodeIconPictureProps.alt ?? t("text-" + p.id),
    } as FeatureAwarePictureProps;
  }
  return null;
});

const qrIconColoredProps = computed<ColoredImgProps | null>(() => {
  const p = current.value;
  if (p?.qrCodeIconColoredProps) return p.qrCodeIconColoredProps;
  if (p?.qrCodeIconPictureProps) return null;
  // Default icon: site signature.
  return {
    src: "/images/svg/icons/steve-hsu.svg",
    colorVar: "bs-primary",
    alt: t("text-steve-hsu"),
  };
});

/** Related link back to another page section. */
const relatedLink = computed(() => current.value?.relatedLink ?? "");

// -------------------------------------------------------------------------
// QR share URL: canonical deep link of the current picture
// -------------------------------------------------------------------------

const shareUrl = computed(() => {
  const url = new URL(window.location.origin + window.location.pathname);
  if (current.value) url.searchParams.set("preview", current.value.id);
  const lang = route.query.lang;
  if (typeof lang === "string" && lang) url.searchParams.set("lang", lang);
  return url.toString();
});

// =========================================================================
// Actions
// =========================================================================

/** Navigate to a picture index and sync the ?preview= deep link. */
function goTo(target: number): void {
  if (target < 0 || target >= contents.value.length) return;
  index.value = target;
  const id = current.value?.id;
  if (id) {
    router.replace({
      query: preserveLangParam({ ...route.query, preview: id }),
    });
  }
}

function prev(): void {
  goTo(index.value - 1);
}

function next(): void {
  goTo(index.value + 1);
}

function showQR(): void {
  push({
    id: "qr-code",
    props: {
      url: shareUrl.value,
      pictureProps: qrIconPictureProps.value,
      coloredProps: qrIconColoredProps.value,
      hideOpenLink: true,
    },
  });
}

// ---- Keyboard (arrows switch; Esc closes via BModal) ----

function onKeydown(e: KeyboardEvent): void {
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prev();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    next();
  }
}

function onShown(): void {
  window.addEventListener("keydown", onKeydown);
  // Fullscreen lightbox: suppress offcanvas edge-swipes while open.
  setSwipeTrackingEnabled(false);
}

function onHidden(): void {
  window.removeEventListener("keydown", onKeydown);
  setSwipeTrackingEnabled(true);
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  setSwipeTrackingEnabled(true);
});

// ---- Touch swipe (progressive enhancement over buttons + arrows) ----

useHorizontalSwipe(stageRef, {
  onLeft: () => next(),
  onRight: () => prev(),
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="title"
    header-class="h5 modal-title"
    title-tag="span"
    no-header-close
    centered
    @shown="onShown"
    @hidden="onHidden"
  >
    <!-- ==== Image stage (touch-swipe target) ==== -->
    <div ref="stageRef" class="picture-viewer-stage">
      <FeatureAwarePicture
        v-if="pictureProps"
        v-bind="pictureProps"
        class="picture-viewer-img no-copy solid-bg"
      />
    </div>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-previous-page')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :disabled="!hasPrev"
            :aria-label="$t('text-previous-page')"
            @click="prev()"
          >
            <i class="bi bi-arrow-left"></i>
          </button>
        </TooltipTrigger>
        <TooltipTrigger :title="t('text-next-page')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :disabled="!hasNext"
            :aria-label="$t('text-next-page')"
            @click="next()"
          >
            <i class="bi bi-arrow-right"></i>
          </button>
        </TooltipTrigger>
        <TooltipTrigger :title="t('text-share')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-share')"
            @click="showQR"
          >
            <i class="bi bi-share"></i>
          </button>
        </TooltipTrigger>
        <TooltipTrigger v-if="relatedLink" :title="t('text-open-related-page')">
          <TypeAwareLink
            :href="relatedLink"
            type="internal"
            class="btn btn-outline-primary btn-no-border"
            :aria-label="$t('text-open-related-page')"
            @click="pop()"
          >
            <i class="bi bi-box-arrow-up-right"></i>
          </TypeAwareLink>
        </TooltipTrigger>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border ms-auto"
          @click="pop()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* --- Image stage (centred, touch-swipe target) --- */
.picture-viewer-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  overflow: hidden;
}

.picture-viewer-stage :deep(.picture-viewer-img) {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>
