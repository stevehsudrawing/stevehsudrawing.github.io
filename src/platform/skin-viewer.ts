/**
 * Skin viewer stage — the imperative three / skinview3d controller.
 *
 * WebGL rendering cannot be Vue-owned, so the modal delegates the
 * whole stage lifecycle to this platform module: it lazily imports
 * the 3D stack (three family + the Blockbench animation JSON, kept
 * OUT of the entry bundles), renders the profile's skin and cape on a
 * skinview3d viewer with the ETF features attached, plays the
 * Blockbench intro once and then the built-in idle loop, and owns the
 * square sizing plus disposal.
 *
 * The content animations are deliberately exempt from the
 * reduced-motion rules (canvas motion is not CSS-gated); the modal's
 * reveal fade follows them instead.
 */

import type { AnimationFileType } from "skinview3d-blockbench";
import type { ETFController } from "skinview3d-etf";
import type { MinecraftProfile } from "../types/app";

// =========================================================================
// Types
// =========================================================================

/** Handle over a live skin-viewer stage. */
export interface SkinViewerStageHandle {
  /** Stops rendering and disposes every resource (idempotent). */
  dispose(): void;
  /**
   * Restarts the Blockbench intro from its first frame (the camera is
   * untouched); callable while the viewer is ready.
   */
  replayIntro(): void;
}

/** Options accepted by {@link initSkinViewerStage}. */
export interface SkinViewerStageOptions {
  /** The square wrapper element the viewer is sized to. */
  stage: HTMLElement;
  /** The canvas element the renderer draws into. */
  canvas: HTMLCanvasElement;
  /** The profile whose skin / cape textures to render. */
  profile: MinecraftProfile;
  /** Called when the cape texture fails to load (the viewer continues). */
  onCapeError: () => void;
  /** Receives non-fatal warnings (unsupported skins, texture issues). */
  onWarning: (message: string) => void;
  /** Reports intro play-state changes (true = playing) for the UI. */
  onIntroStateChange?: (playing: boolean) => void;
}

// =========================================================================
// Stage lifecycle
// =========================================================================

/**
 * Boots the 3D stage: dynamically imports the stack, loads the
 * textures, starts the intro animation and keeps the viewer sized to
 * the square stage.
 *
 * Resolves once the skin (and, when present, the cape) finished
 * loading and the intro started; rejects when the viewer cannot be
 * created or the skin fails to load.
 *
 * @param options - Stage elements, profile and notification callbacks.
 * @returns The handle that owns disposal.
 */
export async function initSkinViewerStage(
  options: SkinViewerStageOptions,
): Promise<SkinViewerStageHandle> {
  const { stage, canvas, profile, onCapeError, onWarning, onIntroStateChange } =
    options;

  // ---- Lazy stack: three family + the Blockbench animation JSON ----
  const [skinview3dModule, etfModule, blockbenchModule, animationModule] =
    await Promise.all([
      import("skinview3d"),
      import("skinview3d-etf"),
      import("skinview3d-blockbench"),
      import("../configs/blockbench-animations/player.animation.json"),
    ]);

  const { SkinViewer, IdleAnimation } = skinview3dModule;
  const { attachETFSkinFeatures } = etfModule;
  const { SkinViewBlockbench } = blockbenchModule;

  /** Measures the current square side of the stage. */
  const measure = (): number =>
    Math.max(0, Math.floor(Math.min(stage.clientWidth, stage.clientHeight)));

  // ---- Viewer (fresh per open; the caller disposes it) ----
  const initialSide = Math.max(1, measure());
  const viewer = new SkinViewer({
    canvas,
    width: initialSide,
    height: initialSide,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
  });

  // ---- Default camera: a 20° downward tilt ----
  // `camera` / `controls` are skinview3d public members; the
  // constructor already set the distance (`adjustCameraDistance`), so
  // re-aim the same radius at a fixed elevation and sync the controls.
  // Replays never touch the camera.
  const cameraTilt = (20 * Math.PI) / 180;
  const cameraDistance = viewer.camera.position.length();
  viewer.camera.position.set(
    0,
    Math.sin(cameraTilt) * cameraDistance,
    Math.cos(cameraTilt) * cameraDistance,
  );
  viewer.controls.update();

  // Auto-detect the skin model (slim / classic) from the texture.
  await viewer.loadSkin(profile.skin_texture);

  if (profile.cape_texture !== null) {
    try {
      await viewer.loadCape(profile.cape_texture);
    } catch {
      // Missing cape is non-fatal — the viewer continues without it.
      onCapeError();
    }
  }

  // ---- Animation: Blockbench intro once, then the idle loop ----
  const ANIMATION_NAME = "animation.player.appear1";
  let controller: ETFController | null = null;

  /** Swaps the finished intro for the idle loop (first run and replays). */
  const finishIntro = (): void => {
    viewer.animation = new IdleAnimation();
    // Replacing the animation slot disconnects the blink ticker
    // (see the extension's ticker docs) — re-attach it.
    controller?.rebind();
    onIntroStateChange?.(false);
  };

  // `connectCape` binds the cape to the animated torso; the library's
  // `initTorso()` runs only when the animation targets the `Torso` bone.
  const intro = new SkinViewBlockbench({
    animation: animationModule.default as AnimationFileType,
    animationName: ANIMATION_NAME,
    connectCape: true,
    onFinish: finishIntro,
  });
  viewer.animation = intro;
  onIntroStateChange?.(true);

  // Attach AFTER the intro occupies the slot: the blink ticker then
  // shares the intro's clock through `addAnimation()`.
  controller = attachETFSkinFeatures(viewer, { onWarning });

  // ---- Square sizing: canvas follows the stage box ----
  const applySize = (): void => {
    const side = measure();
    if (side <= 0) return;
    viewer.setSize(side, side);
  };

  // Defer the write out of the observer callback: `setSize()` rewrites
  // canvas styles, and a synchronous write re-enters the delivery cycle
  // ("ResizeObserver loop completed with undelivered notifications").
  let sizeRaf = 0;
  const queueResize = (): void => {
    if (sizeRaf !== 0) return;
    sizeRaf = requestAnimationFrame(() => {
      sizeRaf = 0;
      applySize();
    });
  };
  applySize();

  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(queueResize);
    observer.observe(stage);
  } else {
    window.addEventListener("resize", queueResize);
  }

  let disposed = false;
  return {
    replayIntro(): void {
      if (disposed) return;
      intro.setAnimation(ANIMATION_NAME);
      viewer.animation = intro;
      // The slot swap disconnected the blink ticker — re-attach it.
      controller?.rebind();
      onIntroStateChange?.(true);
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      if (observer !== null) {
        observer.disconnect();
        observer = null;
      }
      if (sizeRaf !== 0) {
        cancelAnimationFrame(sizeRaf);
        sizeRaf = 0;
      }
      window.removeEventListener("resize", queueResize);
      controller?.detach();
      controller = null;
      viewer.dispose();
    },
  };
}
