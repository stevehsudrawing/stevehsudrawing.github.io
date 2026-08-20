<!--
  StickerModal.vue — Displays a theme-aware sticker with a short line.
  Visibility comes from the shared modal stack (useStackModal).
  The title is a non-i18n terminal command (deliberate exception — the
  near-future system-message aesthetic is language-neutral), e.g.
  `tail $UNY_AI_RUNTIME_LOGS/sigma045/<timestamp>.log`, refreshed on each
  show.  The shown sticker id is a module-level constant so future
  expressions are a one-line change.
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

/** Sticker shown by this modal (module-level constant — add expressions here). */
const STICKER_ID = "observing";

/** Log directory segment for the character's runtime (Kato = SIGMA_045). */
const CHARACTER_LOG_DIR = "sigma045";

/** Celebration confetti colors — the profile major colors. */
const STICKER_COLORS = ["#47c4ee", "#3c96ff"];

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("sticker");
const { pop } = useModalStack();
const { t } = useI18n();

/**
 * Terminal-command style title, e.g.
 * `tail $UNY_AI_RUNTIME_LOGS/sigma045/2026-08-19_22-50-00.log`.
 * Refreshed each time the modal is shown.
 */
const stickerModalTitle = ref("");

watch(visible, (isVisible) => {
  if (isVisible) {
    stickerModalTitle.value =
      `tail $UNY_AI_RUNTIME_LOGS/${CHARACTER_LOG_DIR}/` +
      `${formatLogTimestamp(new Date())}.log`;
  }
});

/**
 * Format a date as a log-filename timestamp, e.g. `2026-08-19_22-50-00`.
 * @param date - The date to format.
 * @returns A zero-padded `YYYY-MM-DD_HH-MM-SS` string.
 */
function formatLogTimestamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
  );
}

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
const stickerSrcMap = computed(() => createStickerSrcMap(STICKER_ID));

/** Alt text for the sticker. */
const stickerAlt = computed(() => t(`text-sticker-of-${STICKER_ID}`));

/** Short line shown below the sticker. */
const message = computed(() => t("text-sticker-message-observing"));
</script>

<template>
  <BModal
    v-model="visible"
    :title="stickerModalTitle"
    header-class="sticker-modal-header code"
    title-class="code-no-bg"
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
        :width="150"
        :height="150"
        class="no-copy solid-bg"
      />
      <p class="sticker-modal-message">{{ message }}</p>
    </div>

    <template #footer>
      <div class="w-100 d-flex justify-content-end">
        <button
          ref="closeBtnRef"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="pop()"
        >
          {{ $t("text-close") }}
        </button>
      </div>
    </template>
  </BModal>
</template>

<style>
/* ==== Sticker modal — terminal "system log" header ==== */

.sticker-modal-header {
  display: block;
}

/* Command prompt — "#" before the command. */
.sticker-modal-header::before {
  content: "#";
  padding-right: 0.6rem;
  color: var(--bs-primary);
}

/* Blinking terminal cursor after the command. */
.sticker-modal-header::after {
  content: "_";
  color: var(--bs-primary);
  animation: stickerCursorBlink 1s step-start infinite;
}

@keyframes stickerCursorBlink {
  50% {
    opacity: 0;
  }
}

/* Steady cursor when motion is reduced / animations are disabled. */
@media (prefers-reduced-motion: reduce) {
  .sticker-modal-header::after {
    animation: none;
  }
}

.no-animations .sticker-modal-header::after {
  animation: none;
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
