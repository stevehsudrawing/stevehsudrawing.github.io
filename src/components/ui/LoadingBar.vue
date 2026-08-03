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

// =========================================================================
// Actions
// =========================================================================

onMounted(() => {
  bar = document.getElementById("loading-bar");
});

/** Show the progress bar and animate to ~85 %. */
function show(): void {
  if (!bar) return;
  bar.classList.remove("done");
  bar.style.display = "";
  // Force reflow so the reset takes effect before adding 'active'
  void bar.offsetWidth;
  bar.classList.add("active");
}

/** Complete the progress bar: animate to 100 % then fade out. */
function complete(): void {
  if (!bar) return;
  bar.classList.add("done");
  bar.classList.remove("active");
  // Hide after the completion transition (350 ms)
  setTimeout(() => {
    if (!bar) return;
    bar.classList.remove("done");
    bar.style.display = "none";
  }, 350);
}

/** Immediately hide the progress bar without the completion animation. */
function hide(): void {
  if (!bar) return;
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
  z-index: 1100;
  cursor: wait;
}

#loading-bar-fill {
  height: 3px;
  width: 0;
  background-color: rgb(var(--bs-link-color-rgb, 13, 110, 253));
  transition: width 0.2s ease-out;
}

#loading-bar.active #loading-bar-fill {
  width: 85%;
  transition: width 2.5s ease-out;
}

#loading-bar.done #loading-bar-fill {
  width: 100%;
  transition: width 0.2s ease-in;
}
</style>
