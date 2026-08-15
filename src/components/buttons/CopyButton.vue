<!--
  CopyButton.vue — Click-to-copy interactive element with tooltip.

  Renders as <a href="#"> or <button type="button"> depending on the
  `tag` prop.  Content is provided via the default slot.

  Copies `copyText` to clipboard on click and shows a toast via
  useToast() (SHOW_TOAST_KEY provide/inject) for user feedback.
-->
<script setup lang="ts">
import { useI18n } from "../../composables/useI18n";
import { useToast } from "../../composables/useToast";
import TooltipTrigger from "../ui/TooltipTrigger.vue";

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
const { showToast } = useToast();

// =========================================================================
// Actions
// =========================================================================

async function onClick(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.copyText);
    showToast("success", `${t("text-copied-text")}: ${props.copyText}`);
  } catch (err) {
    showToast("error", "Failed to copy text");
    console.error("Failed to copy text:", err);
  }
}
</script>

<template>
  <TooltipTrigger :title="$t('text-copy')">
    <a
      v-if="tag !== 'button'"
      ref="elRef"
      href="#"
      :aria-label="$t('text-copy')"
      @click.prevent="onClick"
    >
      <slot />
    </a>
    <button
      v-else
      ref="elRef"
      type="button"
      :aria-label="$t('text-copy')"
      @click="onClick"
    >
      <slot />
    </button>
  </TooltipTrigger>
</template>
