<!--
  LoadingScreen.vue — full-screen loading overlay controller.
  The static HTML (#loading-screen) renders instantly in each page;
  this component manages the fade-out lifecycle and owns the CSS.
-->
<script setup lang="ts">
import { onMounted } from "vue";

let loadingEl: HTMLElement | null = null;

onMounted(() => {
  loadingEl = document.getElementById("loading-screen");
});

/** Hide the loading screen with a fade-out animation, then remove from DOM. */
function hide(): void {
  if (!loadingEl) return;
  loadingEl.classList.add("fade-out");
  setTimeout(() => {
    loadingEl?.parentNode?.removeChild(loadingEl!);
  }, 500);
}

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
  z-index: 1200;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  background-color: var(--bs-body-bg);
  transition: opacity 0.5s ease;
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
