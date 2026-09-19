<!--
  StickerModal.vue — Displays a theme-aware sticker with a short line.
  Visibility comes from the shared modal stack (useStackModal).
  The title is a non-i18n terminal line (deliberate exception — the
  near-future system-message aesthetic is language-neutral): `< Response`
  (`<` marks system output, character-agnostic).  The shown sticker is
  picked per open from the v3.16.1 pool — a random member by default,
  overridable via the stack item's `stickerId`.
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "../../composables/useI18n";
import { useModalFocus } from "../../composables/useModalFocus";
import { useModalStack, useStackModal } from "../../composables/useModalStack";
import { createStickerSrcMap } from "../../core/utils";
import { celebrateAt } from "../../platform/confetti";
import FeatureAwarePicture from "../images/FeatureAwarePicture.vue";

// =========================================================================
// Constants
// =========================================================================

/**
 * Random pool of stickers (the v3.16.1 roster) — one member is picked
 * per open; an explicit `stickerId` from the stack item overrides it.
 */
const STICKER_POOL = [
  "observing",
  "thumb",
  "offering-tea",
  "right",
  "typing",
  "thinking",
  "low-battery",
] as const;

/** Celebration confetti colors — the profile major colors. */
const STICKER_COLORS = ["#47c4ee", "#3c96ff"];

/**
 * Terminal "output" title — `<` marks system output (language-neutral,
 * character-agnostic).  Static — no timestamp / log path.
 */
const STICKER_MODAL_TITLE = "Response";

// =========================================================================
// State
// =========================================================================

const { visible, props: stackProps } = useStackModal("sticker");
const { pop } = useModalStack();
const { t } = useI18n();

/** Sticker shown while the modal is open (rolled once per open). */
const stickerId = ref<string>(STICKER_POOL[0]);

/**
 * Roll the shown sticker on every open: the stack item's explicit
 * `stickerId` when given, otherwise a random pool member.
 */
watch(visible, (isVisible) => {
  if (!isVisible) return;
  const explicit = stackProps.value?.stickerId;
  stickerId.value =
    explicit && (STICKER_POOL as readonly string[]).includes(explicit)
      ? explicit
      : STICKER_POOL[Math.floor(Math.random() * STICKER_POOL.length)];
});

/** Close-button element for keyboard auto-focus. */
const closeBtnRef = ref<HTMLElement | null>(null);

/** Keyboard-aware focus: move focus to Close when opened via Tab. */
const { onShown: onModalShown } = useModalFocus(closeBtnRef);

/**
 * Shown handler — keyboard focus plus a small confetti burst from the
 * dialog's center, behind the modal (confetti zIndex is below the modal).
 */
function onShown(): void {
  onModalShown();
  const dialog = document.querySelector<HTMLElement>(
    ".modal.show .modal-dialog",
  );
  celebrateAt(dialog, STICKER_COLORS, { startVelocity: 25 });
}

/** Theme/format-aware source map for the sticker. */
const stickerSrcMap = computed(() => createStickerSrcMap(stickerId.value));

/** Alt text for the sticker. */
const stickerAlt = computed(() => t(`text-sticker-${stickerId.value}-alt`));

/** Title for the ALT popover header. */
const stickerTitle = computed(() => t(`text-sticker-${stickerId.value}-title`));

/** Short line shown below the sticker. */
const message = computed(() => t(`text-sticker-${stickerId.value}-message`));
</script>

<template>
  <BModal
    v-model="visible"
    :title="STICKER_MODAL_TITLE"
    header-class="sticker-modal-header"
    title-class="font-monospace"
    title-tag="code"
    no-header-close
    centered
    hide-footer
    @shown="onShown"
  >
    <div class="sticker-modal-body">
      <FeatureAwarePicture
        :src-map="stickerSrcMap"
        :feature="['follow-theme']"
        :alt="stickerAlt"
        :title="stickerTitle"
        :width="150"
        :height="150"
        show-alt-button
        class="no-copy solid-bg"
      />
      <p class="sticker-modal-message">{{ message }}</p>
    </div>

    <template #footer>
      <div class="w-100 d-flex">
        <div class="ms-auto">
          <button
            ref="closeBtnRef"
            type="button"
            class="btn btn-outline-primary btn-no-border"
            @click="pop()"
          >
            {{ $t("text-close") }}
          </button>
        </div>
      </div>
    </template>
  </BModal>
</template>

<style>
/* ==== Sticker modal — terminal "system log" header ==== */

.sticker-modal-header {
  display: block;
}

/* Command prompt — "<" marks system output. */
.sticker-modal-header::before {
  content: "<";
  padding-right: 0.6rem;
  color: var(--bs-primary);
}

.sticker-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.sticker-modal-message {
  margin: 0;
  opacity: 0.8;
}
</style>
