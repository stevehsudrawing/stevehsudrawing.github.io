<!--
  CopyProtectedImg.vue -- no-copy protection controller.

  Sets up document-level event delegation (contextmenu + dragstart) to
  prevent copying .no-copy elements.  Owns the CSS (no-copy.css).

  Replaces ui/no-copy.ts + stylesheets/components/no-copy.css.
-->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from "vue";

// =========================================================================
// Actions
// =========================================================================

function onContextMenu(e: MouseEvent): void {
  if ((e.target as HTMLElement).closest(".no-copy")) {
    e.preventDefault();
  }
}

function onDragStart(e: DragEvent): void {
  if ((e.target as HTMLElement).closest(".no-copy")) {
    e.preventDefault();
  }
}

/** Set up delegated event listeners. Idempotent -- safe to call multiple times. */
function init(): void {
  // Remove first to prevent duplicates if called again
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("dragstart", onDragStart);
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("dragstart", onDragStart);
}

onMounted(() => {
  init();
});

onBeforeUnmount(() => {
  document.removeEventListener("contextmenu", onContextMenu);
  document.removeEventListener("dragstart", onDragStart);
});

// =========================================================================
// Expose
// =========================================================================

defineExpose({ init });
</script>

<template>
  <!-- Global event delegation; no template content needed. -->
  <div />
</template>

<style>
/* ==== No-copy -- make elements unselectable and undraggable ==== */

.no-copy {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}

img.no-copy.solid-bg {
  outline: 0.5px solid var(--bs-body-bg);
  outline-offset: -0.5px;
}
</style>
