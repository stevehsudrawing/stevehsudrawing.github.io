/**
 * useModalFocus — keyboard-aware modal auto-focus composable.
 *
 * When a BModal is opened, this composable's `onShown` handler
 * focuses a target element **only if** the user was last using a
 * keyboard (i.e. `<html>` has `.user-input-keyboard`).  Mouse and
 * touch users are unaffected — BModal's default focus management
 * continues to work normally.
 *
 * Usage:
 * ```vue
 * <BModal @shown="onShown" ...>
 *   <button ref="openBtnRef">Open</button>
 * </BModal>
 *
 * const openBtnRef = ref<HTMLElement | null>(null);
 * const { onShown } = useModalFocus(openBtnRef);
 * ```
 */

import { type Ref } from "vue";

/**
 * Create a keyboard-aware modal-focus helper.
 * @param targetRef - Template ref for the element to focus on keyboard open.
 * @returns `{ onShown }` — a handler for BModal's `@shown` event.
 */
export function useModalFocus(targetRef: Ref<HTMLElement | null>): {
  onShown: () => void;
} {
  function onShown(): void {
    if (!document.documentElement.classList.contains("user-input-keyboard")) {
      return;
    }
    targetRef.value?.focus();
  }

  return { onShown };
}
