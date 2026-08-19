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
import { ref, computed, watch, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "../../composables/useI18n";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { useHorizontalSwipe } from "../../composables/useHorizontalSwipe";
import { setSwipeTrackingEnabled } from "../../composables/useGesture";
import { normalizeInternalPath, preserveLangParam } from "../../core/utils";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
import type {
  DisplayPictureData,
  FeatureAwarePictureProps,
  TypeAwareImageProps,
  TypeAwareLinkProps,
} from "../../types/app";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("picture-viewer");
const { push, pop, clear } = useModalStack();

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
 * QR centre icon — resolution: config icon (with id-derived alt) → default
 * signature.  NEVER the poster itself (keeps the full artwork out of the
 * share card).
 */
const qrIcon = computed<TypeAwareImageProps>(() => {
  const p = current.value;
  const configured = p?.qrCodeIcon;
  if (configured) {
    if (configured.type === "picture") {
      return {
        type: "picture",
        imgProps: {
          ...configured.imgProps,
          alt: configured.imgProps.alt ?? t("text-" + p!.id),
        },
      };
    }
    return {
      type: "colored-img",
      imgProps: {
        ...configured.imgProps,
        alt: configured.imgProps.alt ?? t("text-" + p!.id),
      },
    };
  }
  // Default icon: site signature.
  return {
    type: "colored-img",
    imgProps: {
      src: "/images/webp/icons/steve-hsu.webp",
      colorVar: "bs-primary",
      alt: t("text-steve-hsu"),
    },
  };
});

/** Direction of the current picture switch ("next" | "prev"). */
const dir = ref<"next" | "prev">("next");

/** Related link back to another page section (typed, from the config). */
const relatedLink = computed<TypeAwareLinkProps | null>(
  () => current.value?.relatedLink ?? null,
);

/**
 * Whether the viewer was entered via a cross-page navigation.  Vue Router
 * stores the previous entry's URL in `history.state.back`; comparing its
 * normalized path with the current page tells us whether a "Back" button
 * makes sense (returns to the original page) vs a plain Close (stay).
 *
 * `history.state` is NOT reactive — the computed re-evaluates whenever the
 * viewer (de)activates (`visible`), at which point `state.back` already
 * reflects the entry we were opened from.
 */
const cameFromAnotherPage = computed(() => {
  if (!visible.value) return false;
  const back = history.state?.back;
  if (typeof back !== "string" || !back) return false;
  try {
    const backPath = new URL(back, window.location.origin).pathname;
    return (
      normalizeInternalPath(backPath) !==
      normalizeInternalPath(window.location.pathname)
    );
  } catch {
    return false;
  }
});

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
  // Direction is set BEFORE the picture id changes (same render batch), so
  // the leaving picture reads the new direction for its exit.
  dir.value = target > index.value ? "next" : "prev";
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
      icon: qrIcon.value,
      hideOpenLink: true,
    },
  });
}

/** Close the viewer: pop it and stay on the gallery page. */
function close(): void {
  pop();
}

/**
 * Back: return to the page we came from (only reachable when the viewer
 * was entered via a cross-page navigation — see `cameFromAnotherPage`).
 */
function goBack(): void {
  router.back();
}

/**
 * Related-link click — dismiss the whole overlay first (so it never lingers
 * over the destination page), then navigate.
 *
 * Internal links: the navigation is deferred to the next tick because the
 * viewer-close URL cleanup (`stripPreview` → `router.replace`) runs in the
 * same flush and would otherwise cancel a synchronous push.  External
 * links: TypeAwareLink opens the confirm modal as usual.
 */
function onRelatedLinkClick(): void {
  const link = relatedLink.value;
  if (!link) return;
  clear();
  if (link.type === "internal") {
    nextTick(() => router.push(link.href));
  }
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
    size="lg"
    no-header-close
    centered
    @shown="onShown"
    @hidden="onHidden"
  >
    <!-- ==== Image stage (touch-swipe target) ==== -->
    <div ref="stageRef" class="picture-viewer-stage">
      <!-- Picture-switch slide transition (symmetric mirror flow) -->
      <Transition
        mode="out-in"
        enter-active-class="picture-slide-enter-active"
        leave-active-class="picture-slide-leave-active"
        :enter-from-class="
          dir === 'prev'
            ? 'picture-slide-enter-from-prev'
            : 'picture-slide-enter-from-next'
        "
        :leave-to-class="
          dir === 'prev'
            ? 'picture-slide-leave-to-prev'
            : 'picture-slide-leave-to-next'
        "
      >
        <div v-if="pictureProps" :key="current?.id" class="picture-slide-wrap">
          <FeatureAwarePicture
            v-bind="pictureProps"
            class="picture-viewer-img no-copy"
          />
        </div>
      </Transition>
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
        <TooltipTrigger :title="t('text-open-related-page')">
          <TypeAwareLink
            v-if="relatedLink"
            v-bind="relatedLink"
            class="btn btn-outline-primary btn-no-border me-auto"
            :aria-label="$t('text-open-related-page')"
            @click="onRelatedLinkClick()"
          >
            <i class="bi bi-box-arrow-up-right"></i>
          </TypeAwareLink>
        </TooltipTrigger>
        <button
          v-if="cameFromAnotherPage"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          :aria-label="$t('text-back')"
          @click="goBack()"
        >
          {{ $t("text-back") }}
        </button>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="close()"
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
  perspective: 16rem;
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

/* --- Picture-switch slide transition (symmetric mirror flow) --- */

/* Wrapper: keeps the transformed element block-level (transforms do not
   apply to inline elements like <picture>) and caps its width. */
.picture-slide-wrap {
  display: flex;
  justify-content: center;
  max-width: 100%;
}

.picture-slide-enter-active,
.picture-slide-leave-active {
  transition:
    opacity 0.3s ease-in-out,
    transform 0.3s ease-in-out,
    filter 0.3s ease-in-out;
}

/* next: old exits left, new enters from the mirrored (right) side */
.picture-slide-enter-from-next,
.picture-slide-leave-to-prev {
  opacity: 0;
  transform: translateX(25%) rotateY(15deg) scale(0.75);
  filter: blur(1rem);
}

.picture-slide-leave-to-next,
.picture-slide-enter-from-prev {
  opacity: 0;
  transform: translateX(-25%) rotateY(-15deg) scale(0.75);
  filter: blur(1rem);
}
</style>
