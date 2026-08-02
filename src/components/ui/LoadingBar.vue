<!--
  LoadingBar.vue — thin progress bar at the top of the viewport.
  Used by page transitions and language switching.

  The static HTML (#page-transition-progress) is injected at build time
  via build/page-components/header.html.  This component owns the CSS
  and exposes imperative show / complete / hide methods.
-->
<script setup lang="ts">
import { onMounted } from "vue";

let bar: HTMLElement | null = null;

onMounted(() => {
  bar = document.getElementById("page-transition-progress");
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

defineExpose({ show, complete, hide });
</script>

<template>
  <!-- Static HTML in header.html handles instant rendering. -->
  <div />
</template>

<style>
/* ==== Loading Bar - thin progress bar at top of viewport ==== */

#page-transition-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1100;
  cursor: wait;
}

#page-transition-progress-bar {
  height: 3px;
  width: 0;
  background-color: rgb(var(--bs-link-color-rgb, 13, 110, 253));
  transition: width 0.2s ease-out;
}

#page-transition-progress.active #page-transition-progress-bar {
  width: 85%;
  transition: width 2.5s ease-out;
}

#page-transition-progress.done #page-transition-progress-bar {
  width: 100%;
  transition: width 0.2s ease-in;
}
</style>
