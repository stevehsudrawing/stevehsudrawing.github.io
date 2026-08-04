<!--
  CopyButton.vue -- Click-to-copy interactive element with tooltip.

  Renders as <a href="#"> or <button type="button"> depending on the
  `tag` prop.  Content is provided via the default slot.

  Copies `copyText` to clipboard on click and dispatches a "toast-show"
  CustomEvent for user feedback (listened by App.vue → ToastStack).

  Phase 7: replaces .copy-link + data-copy-text pattern previously
  handled by ui/copy-link.ts (now deleted).
-->
<script setup lang="ts">
import { useI18n } from "../../composables/useI18n.js";

// =========================================================================
// Props
// =========================================================================

const props = defineProps<{
  /** Text to copy to the clipboard. */
  copyText: string;
  /** HTML tag to render: "a" or "button".  Defaults to "a". */
  tag?: "a" | "button";
}>();

// =========================================================================
// State
// =========================================================================

const { t } = useI18n();

// =========================================================================
// Actions
// =========================================================================

async function onClick(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.copyText);
    document.dispatchEvent(
      new CustomEvent("toast-show", {
        detail: {
          type: "success",
          message: `${t("text-copied-text", "Copied text")}: ${props.copyText}`,
        },
      }),
    );
  } catch (err) {
    document.dispatchEvent(
      new CustomEvent("toast-show", {
        detail: { type: "error", message: "Failed to copy text" },
      }),
    );
    console.error("Failed to copy text:", err);
  }
}
</script>

<template>
  <a
    v-if="tag !== 'button'"
    ref="elRef"
    href="#"
    :aria-label="$t('text-copy', 'Copy')"
    v-b-tooltip="$t('text-copy', 'Copy')"
    @click.prevent="onClick"
  >
    <slot />
  </a>
  <button
    v-else
    ref="elRef"
    type="button"
    :aria-label="$t('text-copy', 'Copy')"
    v-b-tooltip="$t('text-copy', 'Copy')"
    @click="onClick"
  >
    <slot />
  </button>
</template>
