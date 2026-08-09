import { ref, reactive, onUnmounted } from "vue";

/**
 * Composable for delayed tooltip visibility using Bootstrap's `.manual` mode.
 *
 * Bootstrap's default `delay.show` timer is not cancellable on click —
 * the tooltip appears even after the user clicks and the cursor has left.
 * By switching to `.manual` and managing the timer ourselves, we get precise
 * control over show/hide, including instant dismissal on click.
 *
 * Usage in template (must use `v-b-tooltip.top.manual`):
 * ```html
 * <a v-b-tooltip.top.manual="{ modelValue: tip.visible, title: '...' }"
 *    @mouseenter="tip.scheduleShow()"
 *    @mouseleave="tip.cancelAndHide()"
 *    @click="tip.cancelAndHide()">
 * ```
 *
 * @param delayMs - Delay before the tooltip appears, in milliseconds (default 500).
 * @returns An object with `visible` (ref), `scheduleShow`, and `cancelAndHide`.
 */
export function useDelayedTooltip(delayMs = 500) {
  /** Whether the tooltip is currently visible. */
  const visible = ref(false);

  /** Timer handle for the delayed show. */
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Schedule the tooltip to appear after `delayMs`.
   * Safe to call repeatedly — previous timer is cancelled first.
   */
  function scheduleShow(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = true;
    }, delayMs);
  }

  /**
   * Cancel any pending show timer and hide the tooltip immediately.
   * Safe to call even if the tooltip is already hidden.
   */
  function cancelAndHide(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    visible.value = false;
  }

  /** Clean up the timer when the component unmounts. */
  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  // Wrapping with reactive() ensures that `tip.visible` in the template
  // is auto-unwrapped to a boolean (not a Ref<boolean>), which is what
  // BPopover/BTooltip's `modelValue` prop expects.
  return reactive({ visible, scheduleShow, cancelAndHide });
}
