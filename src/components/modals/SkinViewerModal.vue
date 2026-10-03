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
  unlike the 3D content animation.  The footer carries the tech-stack
  popover, the name-card popover and the intro replay; the stage shows
  self-fading operation hints.  Preview-only: no download affordance.
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useDragState } from "../../composables/core/useDragState";
import { useI18n } from "../../composables/core/useI18n";
import { useToast } from "../../composables/core/useToast";
import { useMinecraftProfile } from "../../composables/minecraft/useMinecraftProfile";
import { useModalFocus } from "../../composables/modals/useModalFocus";
import {
  useModalStack,
  useStackModal,
} from "../../composables/modals/useModalStack";
import { useRefreshWarningModal } from "../../composables/modals/useRefreshWarningModal";
import { isWebGL2Supported } from "../../platform/advanced-feat-support";
import {
  initSkinViewerStage,
  type SkinViewerStageHandle,
} from "../../platform/skin-viewer";
import type { MinecraftProfile } from "../../types/app";
import CopyButton from "../buttons/CopyButton.vue";
import MaterialSymbol from "../icons/MaterialSymbol.vue";
import TypeAwareLink from "../links/TypeAwareLink.vue";
import TooltipTrigger from "../render-functions/TooltipTrigger.vue";
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
/** The community relay that resolves the Mojang profile. */
const PLAYERDB_URL = "https://playerdb.co";

// =========================================================================
// State
// =========================================================================

const { visible } = useStackModal("skin-viewer");
const { pop } = useModalStack();
const { t } = useI18n();
const { showToast } = useToast();
const { openRefreshWarningModal } = useRefreshWarningModal();
const { isDragging, onPointerDown } = useDragState();

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

/** Latest resolved profile (feeds the name card). */
const profileData = ref<MinecraftProfile | null>(null);

/** True while the Blockbench intro plays (replay stays disabled). */
const introPlaying = ref(false);

/** True during the replay fade-out (blocks re-entry). */
const replayBusy = ref(false);

/** Hides the stage during the replay fade-out. */
const stageHidden = ref(false);

/** Name-card face canvas ref. */
const faceCanvasRef = ref<HTMLCanvasElement | null>(null);

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

/** Dashed UUID (canonical JE form) when the raw id has 32 hex chars. */
const profileUuid = computed(() => {
  const raw = profileData.value?.raw_id ?? "";
  return /^[0-9a-f]{32}$/i.test(raw)
    ? raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5")
    : raw;
});

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

/** Draws the 8×8 face + hat layer of a skin texture onto a canvas. */
async function renderFace(
  canvasEl: HTMLCanvasElement,
  src: string,
): Promise<void> {
  const image = new Image();
  image.decoding = "async";
  const loaded = await new Promise<boolean>((resolve) => {
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });
  // Degrade to the empty canvas when the texture cannot be fetched.
  if (!loaded) return;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  // 64×64 skin layout: base face (8,8) + hat overlay (40,8).  Mimic
  // the 3D head: the hat layer fills the canvas while the base face
  // shrinks to 1/1.15, centred — the fringe then overhangs its edge.
  const innerSide = canvasEl.width / 1.15;
  const innerOffset = (canvasEl.width - innerSide) / 2;
  ctx.drawImage(
    image,
    8,
    8,
    8,
    8,
    innerOffset,
    innerOffset,
    innerSide,
    innerSide,
  );
  ctx.drawImage(image, 40, 8, 8, 8, 0, 0, canvasEl.width, canvasEl.height);
}

/** Replays the intro: fade the stage out, restart it, fade back in. */
async function replayIntro(): Promise<void> {
  const handle = stageHandle;
  const stageEl = stageRef.value;
  if (
    !handle ||
    !stageEl ||
    phase.value !== "ready" ||
    introPlaying.value ||
    replayBusy.value
  ) {
    return;
  }
  replayBusy.value = true;
  stageHidden.value = true;
  const seconds = parseFloat(getComputedStyle(stageEl).transitionDuration);
  await new Promise((resolve) =>
    setTimeout(resolve, Number.isFinite(seconds) ? seconds * 1000 : 200),
  );
  // The dialog can close mid-fade — bail on a stale run.
  if (stageHandle === handle && phase.value === "ready") {
    handle.replayIntro();
    stageHidden.value = false;
  }
  replayBusy.value = false;
}

/**
 * Open the refresh confirmation; a successful fetch re-runs `start()`
 * so the name card and the stage re-apply the newest profile.
 */
function openRefresh(): void {
  const state = profileState;
  if (!state) return;
  openRefreshWarningModal({
    api: state.api,
    url: state.url,
    fetchedAt: state.fetchedAt,
    refresh: async () => {
      await state.refresh();
      if (state.error.value === null) void start();
    },
    error: state.error,
  });
}

/** Boots the stage: WebGL gate -> profile -> dynamic 3D stack. */
async function start(): Promise<void> {
  const gen = ++generation;

  // Dispose any previous run's viewer before reusing the canvas.
  disposeStage();
  stageHidden.value = false;
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
  profileData.value = data;
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
      onIntroStateChange: (playing) => {
        introPlaying.value = playing;
      },
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

/** Renders the name-card face when the canvas mounts (lazy popover). */
watch([faceCanvasRef, profileData], ([canvasEl, profile]) => {
  if (canvasEl && profile) void renderFace(canvasEl, profile.skin_texture);
});

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
        :class="{
          'skin-viewer-stage-visible': phase === 'ready' && !stageHidden,
          'drag-cursor': phase === 'ready' && !stageHidden,
          'is-dragging': isDragging,
        }"
        @pointerdown="onPointerDown"
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

      <!-- ==== Hints (modality-aware, self-fading) ==== -->
      <div
        v-if="phase === 'ready'"
        :key="visible ? 'open' : 'closed'"
        class="skin-viewer-hints"
        aria-hidden="true"
      >
        <span class="skin-viewer-hint skin-viewer-hint-mouse">
          <MaterialSymbol name="flip_camera_android" />
          {{ t("text-skin-viewer-hints-mouse") }}
        </span>
        <span class="skin-viewer-hint skin-viewer-hint-touch">
          <MaterialSymbol name="flip_camera_android" />
          {{ t("text-skin-viewer-hints-touch") }}
        </span>
      </div>
    </div>

    <!-- ==== Footer: attribution / name card / replay + Close ==== -->
    <template #footer>
      <div class="d-flex align-items-center">
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
            <li>
              <TypeAwareLink
                type="external"
                :href="PLAYERDB_URL"
                class="link"
                no-qr-code
              >
                playerdb.co
              </TypeAwareLink>
              <span class="text-body-secondary">
                — {{ t("text-skin-viewer-credit-playerdb") }}
              </span>
            </li>
          </ul>
          <p class="small text-body-secondary mb-2">
            {{ t("text-skin-viewer-credit-data") }}
          </p>
          <p class="small text-body-secondary mb-0">
            {{ t("text-skin-viewer-credit-art") }}
          </p>
        </BPopover>

        <BPopover
          :title="t('text-skin-viewer-profile')"
          placement="top"
          click
          lazy
          teleport-to="body"
        >
          <template #target>
            <button
              type="button"
              class="btn btn-outline-primary btn-no-border btn-same-padding"
              :aria-label="t('text-skin-viewer-profile')"
              :disabled="phase !== 'ready'"
            >
              <MaterialSymbol name="id_card" />
            </button>
          </template>
          <div class="skin-viewer-card">
            <canvas
              ref="faceCanvasRef"
              class="skin-viewer-face no-copy"
              width="128"
              height="128"
            ></canvas>
            <div class="skin-viewer-card-info">
              <div class="fw-semibold">{{ profileData?.username }}</div>
              <div class="skin-viewer-uuid">
                <CopyButton
                  v-if="profileUuid"
                  tag="button"
                  :copy-text="profileUuid"
                  class="text-secondary"
                >
                  <span class="font-monospace">{{ profileUuid }}</span>
                  <MaterialSymbol name="content_copy" />
                </CopyButton>
              </div>
            </div>
          </div>
        </BPopover>

        <TooltipTrigger :title="t('text-skin-viewer-replay')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border btn-same-padding"
            :aria-label="t('text-skin-viewer-replay')"
            :disabled="phase !== 'ready' || introPlaying || replayBusy"
            @click="replayIntro"
          >
            <MaterialSymbol name="replay" />
          </button>
        </TooltipTrigger>
        <TooltipTrigger :title="t('text-refresh')">
          <button
            type="button"
            class="btn btn-outline-primary btn-no-border btn-same-padding"
            :aria-label="t('text-refresh')"
            :disabled="phase === 'loading'"
            @click="openRefresh"
          >
            <MaterialSymbol name="refresh" />
          </button>
        </TooltipTrigger>
      </div>

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

/* ==== Hints (modality-aware, self-fading) ====
   Only one variant shows at a time: pointer / touch.  The fade lives
   on the variant; the container is re-created on every open
   (`:key="visible"`) so the animation replays — no JS timer.  The
   shared accessibility rules hide these under reduced motion. */
.skin-viewer-hints {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  pointer-events: none;
  user-select: none;
}

.skin-viewer-hint {
  display: none;
  align-items: center;
  gap: 0.375rem;
  padding: 0.125rem 0.625rem;
  background: var(--bs-tertiary-bg);
  color: var(--bs-body-color);
  border-radius: var(--bs-border-radius);
  font-size: 0.8rem;
  line-height: 1.25;
  animation: skin-hint-fade 5s ease forwards;
}

/* Default (pointer input): wheel / drag. */
.skin-viewer-hint-mouse {
  display: inline-flex;
}

/* Touch modality: pinch / one-finger drag. */
html.user-input-touch .skin-viewer-hint-mouse {
  display: none;
}

html.user-input-touch .skin-viewer-hint-touch {
  display: inline-flex;
}

@keyframes skin-hint-fade {
  0%,
  70% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

/* ==== Name card (face + username + UUID) ==== */
.skin-viewer-card {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.skin-viewer-face {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--bs-border-radius-sm);
  image-rendering: pixelated;
}

.skin-viewer-card-info {
  min-width: 0;
}

/* The UUID line is the copy trigger (CopyButton renders the button). */
.skin-viewer-uuid :deep(button) {
  display: block;
  padding: 0.125rem 0.25rem;
  margin: -0.125rem -0.25rem;
  border: 0;
  border-radius: var(--bs-border-radius-sm);
  background: none;
  color: inherit;
  text-align: left;
  font-size: 0.75rem;
  line-height: 1.4;
}

.skin-viewer-uuid :deep(button:hover) {
  background: var(--bs-tertiary-bg);
}

.skin-viewer-uuid .font-monospace {
  word-break: break-all;
}

/* ==== Credits popover list ==== */
.skin-viewer-credits {
  padding-left: 1rem;
  font-size: 0.875rem;
}
</style>
