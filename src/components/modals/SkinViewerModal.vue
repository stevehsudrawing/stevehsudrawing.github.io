<!--
  SkinViewerModal.vue — 3D showcase of the site owner's Minecraft skin
  (stack id `skin-viewer`).

  The heavy 3D stack (three / skinview3d / skinview3d-etf /
  skinview3d-blockbench + the Blockbench animation JSON — see
  platform/skin-viewer.ts) loads lazily on the first open behind a
  LoadingPlaceholder; WebGL2-less browsers get a message before any
  download.  Each open boots a fresh viewer (Blockbench intro, then
  the idle loop) that is disposed on close; the stage stays 1:1 and
  fades in when ready — the fade follows the reduced-motion rules,
  unlike the 3D content animation.  Preview-only: no download
  affordance; the footer credits entry links the three packages.
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useI18n } from "../../composables/core/useI18n";
import { useToast } from "../../composables/core/useToast";
import { useMinecraftProfile } from "../../composables/minecraft/useMinecraftProfile";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { isWebGL2Supported } from "../../platform/advanced-feat-support";
import {
  initSkinViewerStage,
  type SkinViewerStageHandle,
} from "../../platform/skin-viewer";
import type { MinecraftProfile } from "../../types/app";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import LoadingPlaceholder from "../ui/LoadingPlaceholder.vue";
import TruncatedTitle from "../ui/TruncatedTitle.vue";

// =========================================================================
// Types
// =========================================================================

/** Stage phase of the modal. */
type Phase = "loading" | "ready" | "error";

/** Error classification (message + retry affordance). */
type ErrorKind = "webgl" | "data" | "viewer";

// =========================================================================
// Constants
// =========================================================================

/** Credits links — the three packages of the 3D stack. */
const SKINVIEW3D_URL = "https://github.com/bs-community/skinview3d";
const SKINVIEW3D_ETF_URL = "https://github.com/stevehsudrawing/skinview3d-etf";
const SKINVIEW3D_BLOCKBENCH_URL =
  "https://github.com/Andcool-Systems/skinview3d-blockbench-animation";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("skin-viewer");
const { pop } = useModalStack();
const { t } = useI18n();
const { showToast } = useToast();

/**
 * Lazy profile state — created on the first open so page loads never
 * hit the relay; the SWR cache serves reopens.
 */
let profileState: ReturnType<typeof useMinecraftProfile> | null = null;

const phase = ref<Phase>("loading");
const errorKind = ref<ErrorKind>("viewer");

/** Stage area + square stage + canvas + close-button refs. */
const areaRef = ref<HTMLElement | null>(null);
const stageRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const closeBtnRef = ref<HTMLElement | null>(null);

/** Live viewer handle (disposed on close). */
let stageHandle: SkinViewerStageHandle | null = null;

/** Layout-time stage sizing observer (ResizeObserver when available). */
let stageObserver: ResizeObserver | null = null;

/** Coalesced frame handle for observer-triggered stage re-sizes. */
let stageRaf = 0;

/** Generation token — invalidates stale async runs (close / reopen). */
let generation = 0;

/** Keyboard-aware focus: move focus to Close when opened via Tab. */
const { onShown: onModalShown } = useModalFocus(closeBtnRef);

// =========================================================================
// State (derived)
// =========================================================================

/** Error message key for the current classification. */
const errorLabelKey = computed(() =>
  errorKind.value === "webgl"
    ? "text-skin-viewer-error-webgl"
    : errorKind.value === "data"
      ? "text-skin-viewer-error-network"
      : "text-skin-viewer-error-generic",
);

// =========================================================================
// Actions
// =========================================================================

/** Sizes the square stage to the area's smaller side — 1:1 always. */
function sizeStage(): void {
  const area = areaRef.value;
  const stage = stageRef.value;
  if (!area || !stage) return;
  const side = Math.max(
    1,
    Math.floor(Math.min(area.clientWidth, area.clientHeight)),
  );
  stage.style.width = `${side}px`;
  stage.style.height = `${side}px`;
}

/** Re-sizes the stage when the viewport changes (vh-based area). */
function onWindowResize(): void {
  sizeStage();
}

/**
 * Keeps the square stage in sync with the area's real layout — a
 * ResizeObserver catches the modal's display flip (the cached-profile
 * path can reach sizing before the dialog is laid out), the window
 * listener is the fallback for engines without ResizeObserver.
 */
function bindStageResize(): void {
  unbindStageResize();
  const area = areaRef.value;
  if (typeof ResizeObserver !== "undefined" && area) {
    stageObserver = new ResizeObserver(queueStageSize);
    stageObserver.observe(area);
  } else {
    window.addEventListener("resize", onWindowResize);
  }
}

/**
 * Defers an observer-triggered size write to the next frame — a
 * synchronous write inside the ResizeObserver callback re-enters the
 * delivery cycle ("ResizeObserver loop completed with undelivered
 * notifications").
 */
function queueStageSize(): void {
  if (stageRaf !== 0) return;
  stageRaf = requestAnimationFrame(() => {
    stageRaf = 0;
    sizeStage();
  });
}

/** Tears down whichever stage-resize binding is active. */
function unbindStageResize(): void {
  stageObserver?.disconnect();
  stageObserver = null;
  if (stageRaf !== 0) {
    cancelAnimationFrame(stageRaf);
    stageRaf = 0;
  }
  window.removeEventListener("resize", onWindowResize);
}

/** Disposes the live viewer stage, if any. */
function disposeStage(): void {
  stageHandle?.dispose();
  stageHandle = null;
}

/**
 * Resolves once the shared profile has data (or a terminal error);
 * a fresh fetch is triggered when neither is available yet.
 */
function waitForProfile(
  profile: ReturnType<typeof useMinecraftProfile>,
): Promise<MinecraftProfile | null> {
  if (profile.data.value) return Promise.resolve(profile.data.value);
  return new Promise((resolve) => {
    const stop = watch(
      [profile.data, profile.error],
      () => {
        if (profile.data.value || profile.error.value) {
          stop();
          resolve(profile.data.value ?? null);
        }
      },
      { immediate: true },
    );
  });
}

/** Boots the stage: WebGL gate -> profile -> dynamic 3D stack. */
async function start(): Promise<void> {
  const gen = ++generation;

  // Dispose any previous run's viewer before reusing the canvas.
  disposeStage();
  phase.value = "loading";

  // ---- WebGL 2 gate: no chunk download below the baseline ----
  if (!isWebGL2Supported()) {
    errorKind.value = "webgl";
    phase.value = "error";
    return;
  }

  // ---- Profile (SWR; the first call also triggers the fetch) ----
  const profile = (profileState ??= useMinecraftProfile());
  if (!profile.data.value) {
    void profile.refresh(); // dedupes onto an in-flight fetch
  }
  const data = await waitForProfile(profile);
  if (gen !== generation) return;
  if (!data) {
    errorKind.value = "data";
    phase.value = "error";
    return;
  }

  // ---- Stage (dynamic stack + textures) ----
  await nextTick();
  sizeStage();
  bindStageResize();
  const stage = stageRef.value;
  const canvas = canvasRef.value;
  if (!stage || !canvas) {
    errorKind.value = "viewer";
    phase.value = "error";
    return;
  }

  let handle: SkinViewerStageHandle;
  try {
    handle = await initSkinViewerStage({
      stage,
      canvas,
      profile: data,
      onCapeError: () => showToast("error", t("text-skin-viewer-cape-error")),
      onWarning: (message) => console.warn(message),
    });
  } catch (err) {
    console.warn(err);
    if (gen !== generation) return;
    errorKind.value = "viewer";
    phase.value = "error";
    return;
  }

  if (gen !== generation) {
    // Closed (or restarted) while the stack was loading — drop it.
    handle.dispose();
    return;
  }
  stageHandle = handle;
  phase.value = "ready";
}

/** BModal shown handler — keyboard-aware focus transfer. */
function onShown(): void {
  onModalShown();
}

/** BModal hidden handler — dispose the viewer and the resize binding. */
function onHidden(): void {
  disposeStage();
  unbindStageResize();
}

// =========================================================================
// Lifecycle
// =========================================================================

watch(visible, (isVisible) => {
  if (isVisible) {
    void start();
  } else {
    // Invalidate any in-flight run (its own generation checks bail out).
    generation++;
  }
});

onBeforeUnmount(() => {
  generation++;
  disposeStage();
  unbindStageResize();
});
</script>

<template>
  <BModal
    v-model="visible"
    :title="t('text-skin-viewer-title')"
    header-class="h5 modal-title"
    title-tag="span"
    size="lg"
    no-header-close
    centered
    scrollable
    @shown="onShown"
    @hidden="onHidden"
  >
    <template #title>
      <TruncatedTitle :text="t('text-skin-viewer-title')" />
    </template>

    <!-- ==== Stage: square viewer + loading / error overlay ==== -->
    <div ref="areaRef" class="skin-viewer-area">
      <div
        ref="stageRef"
        class="skin-viewer-stage no-copy"
        :class="{ 'skin-viewer-stage-visible': phase === 'ready' }"
      >
        <canvas
          ref="canvasRef"
          role="img"
          :aria-label="t('text-skin-viewer-alt')"
        ></canvas>
      </div>

      <div v-if="phase !== 'ready'" class="skin-viewer-overlay">
        <LoadingPlaceholder
          :state="phase === 'error' ? 'error' : 'loading'"
          :label="
            phase === 'error' ? t(errorLabelKey) : t('text-skin-viewer-loading')
          "
        />
        <button
          v-if="phase === 'error' && errorKind !== 'webgl'"
          type="button"
          class="btn btn-outline-primary btn-no-border"
          @click="start"
        >
          {{ t("text-retry") }}
        </button>
      </div>
    </div>

    <!-- ==== Footer: credits (left) + Close (right) ==== -->
    <template #footer>
      <BPopover
        :title="t('text-skin-viewer-credits-title')"
        placement="top"
        click
        lazy
        teleport-to="body"
      >
        <template #target>
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border btn-same-padding"
            :aria-label="t('text-skin-viewer-credits')"
          >
            <MaterialSymbol name="info" />
          </button>
        </template>
        <ul class="skin-viewer-credits mb-2">
          <li>
            <TypeAwareLink
              type="external"
              :href="SKINVIEW3D_URL"
              class="link"
              no-qr-code
            >
              skinview3d
            </TypeAwareLink>
            <span class="text-body-secondary">
              (MIT) — {{ t("text-skin-viewer-credit-renderer") }}
            </span>
          </li>
          <li>
            <TypeAwareLink
              type="external"
              :href="SKINVIEW3D_ETF_URL"
              class="link"
              no-qr-code
            >
              skinview3d-etf
            </TypeAwareLink>
            <span class="text-body-secondary">
              (MIT) — {{ t("text-skin-viewer-credit-etf") }}
            </span>
          </li>
          <li>
            <TypeAwareLink
              type="external"
              :href="SKINVIEW3D_BLOCKBENCH_URL"
              class="link"
              no-qr-code
            >
              skinview3d-blockbench
            </TypeAwareLink>
            <span class="text-body-secondary">
              (MIT) — {{ t("text-skin-viewer-credit-blockbench") }}
            </span>
          </li>
        </ul>
        <p class="small text-body-secondary mb-0">
          {{ t("text-skin-viewer-credit-data") }}
        </p>
      </BPopover>

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
    </template>
  </BModal>
</template>

<style scoped>
/* ==== Stage area ====
   Height derives from the viewport; the JS sizing keeps the stage
   exactly 1:1 inside it. */
.skin-viewer-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: min(56vh, 520px);
}

/* ==== Square stage (JS-sized; fades in when ready) ==== */
.skin-viewer-stage {
  position: relative;
  opacity: 0;
  transition: opacity var(--shlh-duration-base) linear;
}

.skin-viewer-stage-visible {
  opacity: 1;
}

.skin-viewer-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ==== Loading / error overlay (above the fading stage) ==== */
.skin-viewer-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: var(--bs-modal-bg);
}

/* ==== Credits popover list ==== */
.skin-viewer-credits {
  padding-left: 1rem;
  font-size: 0.875rem;
}
</style>
