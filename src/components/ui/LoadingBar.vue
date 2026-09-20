<!--
  LoadingBar.vue — thin progress bar at the top of the viewport.
  Used by page transitions and language switching.

  The static HTML (#loading-bar) is rendered in its own template.
  This component owns the CSS and exposes imperative show / complete / hide methods.
-->
<script setup lang="ts">
import { onMounted } from "vue";

// =========================================================================
// State
// =========================================================================

let bar: HTMLElement | null = null;

/** Hide-after-transition cleanup, pending while the width transition runs. */
let pendingCleanup: (() => void) | null = null;

// =========================================================================
// Actions
// =========================================================================

onMounted(() => {
  bar = document.getElementById("loading-bar");
});

/** The fill element of the static bar markup. */
function fillEl(): HTMLElement | null {
  return bar?.querySelector<HTMLElement>("#loading-bar-fill") ?? null;
}

/** Drop a scheduled cleanup (show / hide reset the lifecycle). */
function cancelPendingCleanup(): void {
  pendingCleanup = null;
  fillEl()?.removeEventListener("transitionend", onFillTransitionEnd);
}

/** Run + clear the pending cleanup immediately. */
function runPendingCleanup(): void {
  const cleanup = pendingCleanup;
  cancelPendingCleanup();
  cleanup?.();
}

/**
 * Fill width transitionend — runs the pending completion cleanup.
 * @param event - The transitionend event from the fill.
 */
function onFillTransitionEnd(event: TransitionEvent): void {
  if (event.propertyName !== "width") return;
  runPendingCleanup();
}

/** Show the progress bar and animate to ~85 %. */
function show(): void {
  if (!bar) return;
  cancelPendingCleanup();
  bar.classList.remove("done");
  bar.style.display = "";
  // Force reflow so the reset takes effect before adding 'active'
  void bar.offsetWidth;
  bar.classList.add("active");
}

/** Complete the progress bar: animate to 100 % then hide it. */
function complete(): void {
  if (!bar) return;
  bar.classList.add("done");
  bar.classList.remove("active");
  pendingCleanup = () => {
    if (!bar) return;
    bar.classList.remove("done");
    bar.style.display = "none";
  };
  const fill = fillEl();
  if (!fill || parseFloat(getComputedStyle(fill).transitionDuration) === 0) {
    runPendingCleanup();
    return;
  }
  fill.addEventListener("transitionend", onFillTransitionEnd);
}

/** Immediately hide the progress bar without the completion animation. */
function hide(): void {
  if (!bar) return;
  cancelPendingCleanup();
  bar.classList.remove("active", "done");
  bar.style.display = "none";
}

// =========================================================================
// Expose
// =========================================================================

defineExpose({ show, complete, hide });
</script>

<template>
  <div id="loading-bar" style="display: none">
    <div id="loading-bar-fill"></div>
  </div>
</template>

<style>
/* ==== Loading Bar - thin progress bar at top of viewport ==== */

#loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: var(--shlh-z-overlay);
  cursor: wait;
}

#loading-bar-fill {
  height: 3px;
  width: 0;
  background-color: rgb(var(--bs-primary-rgb));
  transition: width var(--shlh-duration-base) ease-out;
}

/* forced-colors: the brand fill would be forced to `Canvas` (invisible
   against the page); a system color keeps the progress readable. */
@media (forced-colors: active) {
  #loading-bar-fill {
    background-color: CanvasText;
  }
}

#loading-bar.active #loading-bar-fill {
  width: 85%;
  transition: width 2.5s ease-out;
}

#loading-bar.done #loading-bar-fill {
  width: 100%;
  transition: width var(--shlh-duration-base) ease-in;
}
</style>
