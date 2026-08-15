<!--
  TooltipTrigger.vue — Renderless wrapper for Bootstrap tooltip with delayed show.

  Encapsulates v-b-tooltip.top.manual with a built-in delayed-show timer.
  Does NOT introduce extra DOM — the tooltip directive, event
  handlers, and click-to-dismiss are merged onto the first slot child via
  cloneVNode + withDirectives.

  Usage:
  ```vue
  <TooltipTrigger :title="$t('text-settings')">
    <button class="btn">⚙</button>
  </TooltipTrigger>
  ```

  See §4.2.6.1 for the manual tooltip pattern this replaces.
-->
<script lang="ts">
import {
  defineComponent,
  cloneVNode,
  withDirectives,
  ref,
  reactive,
  onUnmounted,
  type VNode,
} from "vue";
import { vBTooltip } from "bootstrap-vue-next";

export default defineComponent({
  props: {
    /** Tooltip text to display. */
    title: { type: String, required: true },
    /** Bootstrap tooltip placement (top / bottom / left / right). */
    placement: { type: String, default: "top" },
    /** Hover delay before the tooltip appears, in milliseconds. */
    delay: { type: Number, default: 500 },
    /**
     * When true, teleports the tooltip to <body> via Bootstrap's
     * teleportTo option.  Use this when the trigger element is inside
     * an overflow: hidden / scroll container.
     */
    teleport: { type: Boolean, default: false },
  },
  setup(props, { slots }) {
    // ---- Delayed tooltip state (inlined from useDelayedTooltip) ----

    const visible = ref(false);
    let timer: ReturnType<typeof setTimeout> | null = null;

    function scheduleShow(): void {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        visible.value = true;
      }, props.delay);
    }

    function cancelAndHide(): void {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      visible.value = false;
    }

    onUnmounted(() => {
      if (timer) clearTimeout(timer);
    });

    // Wrapping with reactive() ensures that `tip.visible` in the
    // directive value is auto-unwrapped to a boolean, matching what
    // BPopover/BTooltip's `modelValue` prop expects.
    const tip = reactive({ visible, scheduleShow, cancelAndHide });

    return () => {
      const children = slots.default?.();
      if (!children || children.length === 0) return null;

      const vnode = children[0] as VNode;
      if (!vnode) return null;

      // ---- Build tooltip directive value ----
      const tooltipValue: Record<string, unknown> = {
        modelValue: tip.visible,
        title: props.title,
      };
      if (props.teleport) {
        tooltipValue.teleportTo = "body";
      }

      // ---- Chain event handlers (tooltip action runs first) ----
      //
      // cloneVNode merges same-name event handlers into an array,
      // which would cause the original handler to fire twice
      // (once via the vnode's own props, once via the chained
      // wrapper).  Strip the originals first so only the chained
      // version remains.
      const origProps = (vnode.props ?? {}) as Record<string, unknown>;

      const origOnClick = origProps.onClick;
      const origOnMouseenter = origProps.onMouseenter;
      const origOnMouseleave = origProps.onMouseleave;

      if (vnode.props) {
        delete vnode.props.onClick;
        delete vnode.props.onMouseenter;
        delete vnode.props.onMouseleave;
      }

      const onMouseenter = chainHandler(origOnMouseenter, tip.scheduleShow);
      const onMouseleave = chainHandler(origOnMouseleave, tip.cancelAndHide);
      const onClick = chainHandler(origOnClick, tip.cancelAndHide);

      const cloned = cloneVNode(vnode, {
        onMouseenter,
        onMouseleave,
        onClick,
      });

      // Apply v-b-tooltip.<placement>.manual directive
      return withDirectives(cloned, [
        [
          vBTooltip,
          tooltipValue,
          undefined,
          { [props.placement]: true, manual: true },
        ],
      ]);
    };
  },
});

// =========================================================================
// Helpers
// =========================================================================

/**
 * Chain a new event handler before an existing one.
 * The extra handler runs first, then the original.
 */
function chainHandler(
  existing: unknown,
  extra: (...args: unknown[]) => void,
): ((...args: unknown[]) => void) | undefined {
  if (typeof existing !== "function") return extra;
  const existingFn = existing as (...args: unknown[]) => void;
  return (...args: unknown[]) => {
    extra(...args);
    existingFn(...args);
  };
}
</script>
