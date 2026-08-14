/**
 * useModalStack — unified modal-stack coordination.
 *
 * Module-level singleton: all modal components share a single stack.
 * Only the top entry is visible.  Switching is fully reactive — when
 * the stack changes, each modal's derived `visible` computed flips in
 * the same render flush, so the outgoing modal's hide animation
 * overlaps the incoming show animation (the proven External <-> QR
 * nextTick-overlap timing).
 *
 * Semantics:
 * - push(item) — open a modal on top of the current one
 * - pop()      — close the top modal, revealing the one below
 * - clear()    — dismiss all modals (backdrop click / Esc)
 *
 * Modal components use useStackModal(id) to obtain:
 * - `visible` — writable computed bound to BModal's v-model.  When
 *   BModal sets it false (backdrop click / Esc), the setter calls
 *   clear().
 * - `props`   — narrowed props for the component.  When the modal
 *   leaves the top of the stack, the last props are retained for
 *   MODAL_FADE_MS so the hide animation never renders an empty
 *   shell, then retired to null.
 */

import {
  computed,
  onScopeDispose,
  ref,
  watch,
  type Ref,
  type ComputedRef,
} from "vue";
import type { ModalStackItem, ModalId } from "../types/app";

// =========================================================================
// Module-level singleton state
// =========================================================================

/** The modal stack — top of the array is the visible modal. */
const stack = ref<ModalStackItem[]>([]);

/** Top stack entry (the only visible modal), or null. */
const top = computed<ModalStackItem | null>(
  () => stack.value[stack.value.length - 1] ?? null,
);

/**
 * Fade-out duration of `.modal.fade .modal-dialog` in base.css
 * (transform / filter 0.3s).  Outgoing props must outlive this so the
 * hide animation shows real content instead of an empty shell.
 */
const MODAL_FADE_MS = 300;

// =========================================================================
// Composable
// =========================================================================

/**
 * Global modal stack controller.
 *
 * @returns Shared reactive stack state and mutation helpers.
 */
export function useModalStack(): {
  /** The full stack (top is last). */
  stack: Ref<ModalStackItem[]>;
  /** The top stack entry, or null. */
  top: ComputedRef<ModalStackItem | null>;
  /** Push a modal onto the stack. */
  push: (item: ModalStackItem) => void;
  /** Pop the top modal (reveals the previous one, if any). */
  pop: () => void;
  /** Clear the whole stack (dismiss everything). */
  clear: () => void;
} {
  function push(item: ModalStackItem): void {
    stack.value.push(item);
  }

  function pop(): void {
    stack.value.pop();
  }

  function clear(): void {
    stack.value = [];
  }

  return { stack, top, push, pop, clear };
}

/**
 * Modal-component convenience: derived visibility + narrowed props.
 *
 * @param id - This modal's id in the stack.
 * @returns `visible` (writable computed for BModal v-model — a false
 *          write means backdrop/Esc and clears the stack) and `props`
 *          (narrowed props while this modal is on top; retained for
 *          MODAL_FADE_MS after it leaves the top, then null).
 */
export function useStackModal<K extends ModalId>(
  id: K,
): {
  /** Writable computed for BModal's v-model. */
  visible: ComputedRef<boolean>;
  /** Narrowed props, retained through the fade-out, then null. */
  props: Ref<Extract<ModalStackItem, { id: K }>["props"] | null>;
};
export function useStackModal(id: ModalId): {
  visible: ComputedRef<boolean>;
  props: Ref<ModalStackItem["props"] | null>;
} {
  const { clear } = useModalStack();

  const visible = computed<boolean>({
    get: () => top.value?.id === id,
    set: (v: boolean) => {
      if (!v) clear();
    },
  });

  // Last active props — kept alive while the modal hides, then null.
  // A plain computed off `top` would null instantly on pop/clear, so
  // BModal's ~300ms hide animation would render a blank dialog.
  const props = ref<ModalStackItem["props"] | null>(null);
  let retireTimer: ReturnType<typeof setTimeout> | null = null;

  watch(
    top,
    (entry) => {
      if (entry?.id === id) {
        // On top: adopt the entry's props immediately and cancel any
        // pending retirement.
        if (retireTimer !== null) {
          clearTimeout(retireTimer);
          retireTimer = null;
        }
        props.value = entry.props;
      } else if (props.value !== null && retireTimer === null) {
        // No longer on top: keep the last props through the fade-out,
        // then retire them so the next activation starts fresh.
        retireTimer = setTimeout(() => {
          props.value = null;
          retireTimer = null;
        }, MODAL_FADE_MS);
      }
    },
    { immediate: true },
  );

  onScopeDispose(() => {
    if (retireTimer !== null) clearTimeout(retireTimer);
  });

  return { visible, props };
}
