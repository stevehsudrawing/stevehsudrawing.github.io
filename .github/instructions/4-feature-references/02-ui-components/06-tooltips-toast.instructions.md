---
description: >
  Tooltips & Toast: v-b-tooltip directive, ToastStack.vue (BToast stack with
  TransitionGroup), useToast() composable.
  Use when: adding tooltips, modifying toast behavior, or changing notification patterns.
applyTo: >
  src/components/ui/ToastStack.vue;
  src/composables/useToast.ts
---

#### 4.2.6 Tooltips & Toast

##### 4.2.6.1 Tooltips

Use `v-b-tooltip` from `bootstrap-vue-next`:

```html
<a
  v-b-tooltip="{ title: $t('text-settings', 'Settings'), delay: { show: 500 } }"
  ...
></a>
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
