---
description: >
  Tooltips & Toast: v-b-tooltip.top.lazy directive, ToastStack.vue (BToast stack with
  TransitionGroup), useToast() composable.
  Use when: adding tooltips, modifying toast behavior, or changing notification patterns.
applyTo: >
  src/components/ui/ToastStack.vue;
  src/composables/useToast.ts
---

#### 4.2.6 Tooltips & Toast

##### 4.2.6.1 Tooltips

**Preferred pattern** (when `delay.show` is needed): use `v-b-tooltip.top.manual`
with the `useDelayedTooltip()` composable. This avoids a Bootstrap bug where
the built-in `delay.show` timer is not cancellable on click, causing the
tooltip to appear after the cursor has already left.

```vue
<script setup>
import { useDelayedTooltip } from "../composables/useDelayedTooltip";
const tip = useDelayedTooltip(500);
</script>

<template>
  <a
    v-b-tooltip.top.manual="{
      modelValue: tip.visible,
      title: $t('text-settings', 'Settings'),
    }"
    @mouseenter="tip.scheduleShow()"
    @mouseleave="tip.cancelAndHide()"
    @click="tip.cancelAndHide()"
    ...
  ></a>
</template>
```

The composable pattern gives precise control: scheduled show is cancelled
on `mouseleave` or `click`, and the timer is cleaned up on `onUnmounted`.

**Legacy pattern** (no delay, or delay without click-dismissal concern):

```html
<a v-b-tooltip.top.lazy="{ title: $t('text-settings', 'Settings') }" ...></a>
```

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
