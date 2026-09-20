<!--
  LoadingScreen.vue — full-screen loading overlay controller.
  The static HTML (#loading-screen) renders instantly in each page;
  this component manages the fade-out lifecycle and owns the CSS.
-->
<script setup lang="ts">
import { onMounted } from "vue";

// =========================================================================
// State
// =========================================================================

let loadingEl: HTMLElement | null = null;

// =========================================================================
// Actions
// =========================================================================

onMounted(() => {
  loadingEl = document.getElementById("loading-screen");
});

/**
 * Remove the element once its fade-out ends.  Runs immediately when
 * transitions are disabled (reduced motion / .no-animations).
 * @param el - The loading-screen element.
 */
function afterFadeOut(el: HTMLElement): void {
  const finish = (): void => {
    el.parentNode?.removeChild(el);
  };
  if (parseFloat(getComputedStyle(el).transitionDuration) === 0) {
    finish();
    return;
  }
  el.addEventListener(
    "transitionend",
    function handler(event: TransitionEvent): void {
      if (event.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", handler);
      finish();
    },
  );
}

/** Hide the loading screen with a fade-out animation, then remove from DOM. */
function hide(): void {
  if (!loadingEl) return;
  loadingEl.classList.add("fade-out");
  afterFadeOut(loadingEl);
}

// =========================================================================
// Expose
// =========================================================================

defineExpose({ hide });
</script>

<template>
  <!-- Static HTML in each page handles instant rendering. -->
  <div></div>
</template>

<style>
/* ==== Loading Screen - initial page load overlay ==== */

.loading-screen {
  position: fixed;
  inset: 0;
  z-index: var(--shlh-z-loading-screen);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  background-color: var(--bs-body-bg);
  transition: opacity var(--shlh-duration-slow) ease;
  cursor: wait;
}

@supports not (inset: 0) {
  .loading-screen {
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}

.loading-screen.fade-out {
  opacity: 0;
  pointer-events: none;
}
</style>
