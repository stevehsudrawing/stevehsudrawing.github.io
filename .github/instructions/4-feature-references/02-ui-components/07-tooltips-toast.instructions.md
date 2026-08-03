---
description: >
  Tooltips & Toast: tooltips.ts (Bootstrap tooltip lifecycle, i18n listener), v-b-tooltip
  directive, ToastStack.vue (BToast stack with TransitionGroup), useToast() composable,
  toast.ts bridge for legacy consumers.
  Use when: adding tooltips, modifying toast behavior, or changing notification patterns.
applyTo: >
  src/ui/tooltips.ts;
  src/ui/toast.ts;
  src/components/ui/ToastStack.vue;
  src/composables/useToast.ts
---

#### 4.2.7 Tooltips & Toast

##### 4.2.7.1 Tooltips — Legacy (tooltips.ts)

`createTooltip(el)`, `disposeTooltip(el)`, `initAllTooltips()`,
`initTooltipI18nListener()` for build-time injected elements.
Uses `window.bootstrap.Tooltip` directly.

##### 4.2.7.2 Tooltips — Vue (v-b-tooltip)

For Vue-rendered elements, use `v-b-tooltip` from `bootstrap-vue-next`:

```html
<a v-b-tooltip="$t('text-settings', 'Settings')" ...></a>
```

When link cards/button groups are Vue-ified (Phase 7), all tooltip management
migrates to `v-b-tooltip`.

##### 4.2.7.3 Toast — Architecture

```
App.vue
  └─ provide(SHOW_TOAST_KEY, ...)
       │
       ├── ToastStack.vue (BToast + TransitionGroup)
       └── Consumers: useToast() composable, toast.ts bridge
```

##### 4.2.7.4 showToast(type, message)

| type        | BToast variant           |
| ----------- | ------------------------ |
| `"success"` | `success` (green, solid) |
| `"error"`   | `danger` (red, solid)    |

Auto-dismiss via BToast timer. Stack managed by reactive `toasts[]` array.

##### 4.2.7.5 useToast() Composable

Injects `SHOW_TOAST_KEY` (symbol). Throws if called outside a component tree
where the key is provided.
