---
description: >
  Tooltips & Toast: TooltipTrigger.vue (renderless wrapper), v-b-tooltip.top.
  lazy directive, ToastStack.vue (BToast stack with TransitionGroup), useToast()
  composable. Use when: adding tooltips, modifying toast behavior, or changing
  notification patterns.
applyTo: >
  src/components/ui/TooltipTrigger.vue;
  src/components/ui/ToastStack.vue;
  src/composables/useToast.ts
---

#### 4.2.6 Tooltips & Toast

##### 4.2.6.1 Tooltips

**Preferred pattern**: use `<TooltipTrigger>` — a renderless Vue component that
encapsulates `v-b-tooltip.top.manual` + `useDelayedTooltip()`. It does not
introduce extra DOM; the tooltip directive and event handlers are merged onto
the first slot child.

```vue
<script setup>
import TooltipTrigger from "../components/ui/TooltipTrigger.vue";
</script>

<template>
  <TooltipTrigger :title="$t('text-settings', 'Settings')">
    <button class="btn">⚙</button>
  </TooltipTrigger>
</template>
```

**Props**:

| Prop        | Type      | Default    | Description                                            |
| ----------- | --------- | ---------- | ------------------------------------------------------ |
| `title`     | `string`  | (required) | Tooltip text                                           |
| `placement` | `string`  | `"top"`    | Bootstrap placement (top/bottom/left/right)            |
| `delay`     | `number`  | `500`      | Hover delay before tooltip appears (ms)                |
| `teleport`  | `boolean` | `false`    | Teleport tooltip to `<body>` (for overflow containers) |

Behaviors provided automatically: delayed show on hover, instant hide on
`mouseleave` or `click`, timer cleanup on unmount.

**Why not `v-b-tooltip` directly?** Bootstrap's default `delay.show` timer is
not cancellable on click — the tooltip appears even after the cursor has left.
`TooltipTrigger` works around this by managing its own delay timer internally.

**When to use `v-b-tooltip` directly**: only for simple tooltips that do
**not** need a hover delay (`v-b-tooltip.top.lazy` without `.manual`).

**Constraint**: `TooltipTrigger` must wrap an interactive element (`<a>`,
`<button>`, or a component that renders one). Tooltips on non-interactive
elements (e.g. `<span>`, `<div>`) are an accessibility anti-pattern and
are not supported.

##### 4.2.6.2 Toast — Architecture

```
App.vue
  └─ provide(SHOW_TOAST_KEY, ...)
       │
       ├── ToastStack.vue (BToast + TransitionGroup)
       └── Consumers: useToast() composable
```

##### 4.2.6.3 showToast(type, message)

| type        | BToast variant           |
| ----------- | ------------------------ |
| `"success"` | `success` (green, solid) |
| `"error"`   | `danger` (red, solid)    |

Auto-dismiss via BToast timer. Stack managed by reactive `toasts[]` array.

##### 4.2.6.5 useToast() Composable

Injects `SHOW_TOAST_KEY` (symbol). Throws if called outside a component tree
where the key is provided.
