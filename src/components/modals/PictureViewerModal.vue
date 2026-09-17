<!--
  PictureViewerModal.vue — single-image lightbox (stack id `picture-viewer`).

  Opened through openPictureViewer() (composables/usePictureViewer.ts) by
  the FeatureAwarePicture overlay preview button — or by any other caller
  that wants to show one picture enlarged.

  Deliberately independent of the Swiper stage and of the URL wiring: it
  reads no query parameters and creates no history entry of its own
  (`?picId=` / `?picGroupId=` belong to the URL owner and the GROUP viewer,
  which mirrors the entry param back to the URL).  Leaving the page closes
  it (App.vue).

  Chrome: the standard BModal shell — the picture title, an optional
  centered message under the stage, and a footer with the related-link
  button (when the picture carries one) plus Close.  Deliberately no QR
  share button (a share target is a URL, and `TypeAwareLink` /
  `ExternalLinkConfirmModal` own that decision) and no Back button (Back
  would be synonymous with Close here).  The image keeps the ALT button
  (title + description popover) but never a preview button (no
  recursion).  Preview-only: `.no-copy`.
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { setSwipeTrackingEnabled } from "../../composables/useGesture";
import { useI18n } from "../../composables/useI18n";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import type { FeatureAwarePictureProps } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("picture-viewer");
const { pop, clear } = useModalStack();
const { t } = useI18n();
const router = useRouter();

/**
 * Chrome title — the picture's own title, or the localized default when
 * none was passed (an empty string falls back too: `||`, never `??`).
 */
const title = computed(
  () => stackProps.value?.img.title || t("text-image-preview"),
);

/** Optional message rendered under the stage. */
const message = computed(() => stackProps.value?.img.message ?? "");

/** Related link of the picture (footer button — hidden when absent). */
const relatedLink = computed(() => stackProps.value?.img.relatedLink ?? null);

/**
 * Stage display props: the caller's image props with the stage-owned keys
 * stripped (`class` is replaced, `aspectRatio` / `width` / `height` may
 * not compete with the stage sizing), the ALT button forced on when an
 * alt text exists and the preview button forced off.
 */
const imageProps = computed<FeatureAwarePictureProps | null>(() => {
  const img = stackProps.value?.img;
  if (!img) return null;
  const {
    class: _class,
    aspectRatio: _aspectRatio,
    width: _width,
    height: _height,
    ...rest
  } = img;
  return {
    ...rest,
    class: "picture-single-img no-copy",
    showAltButton: !!img.alt,
    previewable: false,
  };
});

// =========================================================================
// Actions
// =========================================================================

/** Close the lightbox — stay on the current page, keep the history intact. */
function close(): void {
  pop();
}

/**
 * Related-link click — only INTERNAL links dismiss the overlay: the
 * picture is about to be replaced by its destination page, so the whole
 * stack is cleared and the navigation is pushed on the next tick (the
 * close bookkeeping runs in the same flush and would otherwise cancel a
 * synchronous push).
 *
 * Every other type keeps the stack intact: `TypeAwareLink`'s own handler
 * (which runs first) pushes the confirmation modal for external links —
 * clearing here would remove the modal it had just pushed — and handles
 * email / anchor links natively.  The lightbox stays underneath as the
 * user's context; the confirmation dismisses itself (`pop()`), and only
 * Esc / backdrop clear the whole stack.
 */
function onRelatedLinkClick(): void {
  const link = relatedLink.value;
  if (!link || link.type !== "internal") return;
  clear();
  nextTick(() => router.push(link.href));
}

function onShown(): void {
  // Fullscreen lightbox: suppress offcanvas edge-swipes while open.
  setSwipeTrackingEnabled(false);
}

function onHidden(): void {
  setSwipeTrackingEnabled(true);
}

onBeforeUnmount(() => {
  setSwipeTrackingEnabled(true);
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="title"
    header-class="h5 modal-title"
    title-tag="span"
    size="xl"
    no-header-close
    centered
    @shown="onShown"
    @hidden="onHidden"
  >
    <!-- ==== Single-image stage ==== -->
    <div class="picture-single-stage">
      <FeatureAwarePicture v-if="imageProps" v-bind="imageProps" />
    </div>

    <!-- ==== Optional message (centered under the picture) ==== -->
    <p v-if="message" class="picture-single-message">{{ message }}</p>

    <template #footer>
      <div class="w-100 d-flex">
        <TooltipTrigger :title="t('text-open-related-page')">
          <TypeAwareLink
            v-if="relatedLink"
            v-bind="relatedLink"
            class="btn btn-outline-primary btn-no-border me-auto"
            :aria-label="$t('text-open-related-page')"
            @click="onRelatedLinkClick()"
            hide-indicator
          >
            <MaterialSymbol name="open_in_new" />
          </TypeAwareLink>
        </TooltipTrigger>
        <button
          type="button"
          class="btn btn-outline-primary btn-no-border ms-auto"
          @click="close()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style scoped>
/* --- Single-image stage --- */
.picture-single-stage {
  position: relative;
  min-height: 50vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* The picture never exceeds the stage.  NOTE: the `class` prop lands on
   the <img> (a declared prop never falls through to the root element),
   so the overlay wrapper is matched by its own class name and the img by
   an element selector — a `.picture-single-img img` rule would never
   match anything. */
.picture-single-stage :deep(.feature-aware-picture),
.picture-single-stage :deep(picture) {
  max-width: 100%;
}

/* The img fits the stage: capped by the width AND by the available
   viewport height (the modal chrome + margins are deducted), so a large
   picture shrinks instead of producing a vertical scrollbar.  Two
   declarations on purpose: the `vh` one is the fallback for browsers
   without `dvh` support (an unsupported unit invalidates the whole
   declaration). */
.picture-single-stage :deep(img) {
  max-width: 100%;
  max-height: min(70vh, calc(100vh - 12rem));
  max-height: min(70vh, calc(100dvh - 12rem));
  object-fit: contain;
}

/* --- Optional message (under the picture) --- */
.picture-single-message {
  max-width: 32rem;
  margin: 0.75rem auto 0;
  text-align: center;
  color: var(--bs-secondary-color);
}
</style>
