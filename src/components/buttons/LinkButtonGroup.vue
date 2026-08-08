<!--
  LinkButtonGroup.vue — Single link-button group with horizontal scroll hint.
  Renders one LinkButtonGroupData item with its buttons and a
  "Scroll Horizontally" indicator that appears when the group overflows.
-->
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import LinkButton from "./LinkButton.vue";
import type { LinkButtonData } from "../../types/app";
import { useI18n } from "../../composables/useI18n";

// =========================================================================
// Props
// =========================================================================

defineProps<{
  /** Array of button definitions for this group. */
  buttons: LinkButtonData[];
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();
const groupRef = ref<HTMLElement | null>(null);
const showHint = ref(false);

// -------------------------------------------------------------------------
// Overflow detection
// -------------------------------------------------------------------------

let resizeTicking = false;

/** Check whether the button group overflows horizontally. */
function checkOverflow(): void {
  const el = groupRef.value;
  if (!el) return;
  showHint.value = el.scrollWidth > el.clientWidth;
}

/** Throttled resize handler. */
function onResize(): void {
  if (!resizeTicking) {
    requestAnimationFrame(() => {
      checkOverflow();
      resizeTicking = false;
    });
    resizeTicking = true;
  }
}

// =========================================================================
// Actions
// =========================================================================

onMounted(async () => {
  await nextTick();
  checkOverflow();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <div
    v-if="buttons.length > 0"
    ref="groupRef"
    class="btn-group link-button-group"
  >
    <LinkButton v-for="(button, idx) in buttons" :key="idx" :button="button" />
  </div>
  <div
    v-if="buttons.length > 0 && showHint"
    class="scroll-hint"
    aria-hidden="true"
  >
    <i class="bi bi-chevron-left"></i>
    <span>{{ t("text-scroll-horizontally", "Scroll Horizontally") }}</span>
    <i class="bi bi-chevron-right"></i>
  </div>
</template>

<style scoped>
.btn-group {
  max-width: 100%;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
}

/* ==== Scroll Hint ==== */

.scroll-hint {
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
</style>
