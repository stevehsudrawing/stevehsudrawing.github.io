<!--
  ScrollHint.vue -- horizontal scroll indicator for overflowing .link-button-group containers.

  The .link-button-group elements are build-time injected HTML.  This component
  creates/removes hint elements imperatively after each group, owns the CSS,
  and manages a global resize listener for overflow detection.

  Replace ui/scroll-hint.ts and stylesheets/components/scroll-hint.css.
-->
<script setup lang="ts">
import { onBeforeUnmount } from "vue";
import { useI18n } from "../../composables/useI18n";

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

let resizeTicking = false;

function onResize(): void {
  if (!resizeTicking) {
    requestAnimationFrame(() => {
      updateAllHints();
      resizeTicking = false;
    });
    resizeTicking = true;
  }
}

// =========================================================================
// Actions
// =========================================================================

/**
 * Check all .link-button-group containers and toggle their hint visibility
 * based on whether the group overflows.
 */
function updateAllHints(): void {
  document
    .querySelectorAll<HTMLElement>(".link-button-group")
    .forEach((group) => {
      const hint = group.nextElementSibling;
      if (!hint || !hint.classList.contains("scroll-hint")) return;
      const overflows = group.scrollWidth > group.clientWidth;
      if (overflows) {
        hint.classList.add("visible");
      } else {
        hint.classList.remove("visible");
      }
    });
}

/**
 * Create a "Scroll Horizontally" hint element after a .link-button-group.
 * Idempotent: does nothing if a hint already exists.
 */
function createHint(group: HTMLElement): void {
  const existing = group.nextElementSibling;
  if (existing && existing.classList.contains("scroll-hint")) return;

  const hint = document.createElement("div");
  hint.className = "scroll-hint";
  hint.setAttribute("aria-hidden", "true");
  hint.innerHTML =
    '<i class="bi bi-chevron-left"></i> <span>' +
    t("text-scroll-horizontally", "Scroll Horizontally") +
    '</span> <i class="bi bi-chevron-right"></i>';
  group.insertAdjacentElement("afterend", hint);
}

/**
 * Remove the scroll hint element after a .link-button-group.
 */
function removeHint(group: HTMLElement): void {
  const hint = group.nextElementSibling;
  if (hint && hint.classList.contains("scroll-hint")) {
    hint.remove();
  }
}

/**
 * Create hints for every .link-button-group on the page and
 * set up a global resize listener to toggle their visibility.
 * Delegates to {@link createHint} for each matching element.
 */
function initAllHints(): void {
  const groups = document.querySelectorAll<HTMLElement>(".link-button-group");
  if (groups.length === 0) return;

  groups.forEach(createHint);
  updateAllHints();

  window.addEventListener("resize", onResize);
}

// Clean up resize listener when component unmounts
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

// =========================================================================
// Expose
// =========================================================================

defineExpose({ createHint, removeHint, updateAllHints, initAllHints });
</script>

<template>
  <!-- Imperative DOM manipulation; no template content needed. -->
  <div />
</template>

<style>
/* ==== Scroll Hint - horizontal scroll indicator ==== */

.scroll-hint {
  display: none;
  text-align: center;
  font-size: 0.75rem;
  color: var(--bs-secondary-color, #6c757d);
  margin-top: 0.375rem;
  user-select: none;
  animation: scrollHintFadeIn 0.3s ease;
}

.scroll-hint i {
  font-size: 0.7rem;
  vertical-align: middle;
}

@keyframes scrollHintFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-hint.visible {
  display: block;
}
</style>
