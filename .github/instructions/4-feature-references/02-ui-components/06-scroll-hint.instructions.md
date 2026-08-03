---
description: >
  Scroll Hint: ScrollHint.vue (horizontal scroll indicator for .link-button-group containers),
  scroll-hint.ts bridge (window.__scrollHint).  Imperative DOM creation/removal, resize-based
  overflow detection.  Use when: modifying scroll hint behavior or .link-button-group overflow.
applyTo: >
  src/components/ui/ScrollHint.vue;
  src/ui/scroll-hint.ts
---

#### 4.2.6 Scroll Hint

##### 4.2.6.1 Architecture

```
ScrollHint.vue
  ├─ State: resizeTicking flag, onResize() handler
  ├─ Actions: createHint(), removeHint(), updateAllHints(), initAllHints()
  └─ Expose: { createHint, removeHint, updateAllHints, initAllHints }
       │
       └── scroll-hint.ts (bridge → window.__scrollHint)
```

##### 4.2.6.2 API

| Method              | Behavior                                                             |
| ------------------- | -------------------------------------------------------------------- |
| `createHint(group)` | Create `<div class="scroll-hint">` after a group. Idempotent.        |
| `removeHint(group)` | Remove the hint element.                                             |
| `updateAllHints()`  | Toggle `.visible` class based on `scrollWidth > clientWidth`.        |
| `initAllHints()`    | Batch: createHint for all groups + updateAllHints + resize listener. |

##### 4.2.6.3 Resize Listener

Managed via `requestAnimationFrame` throttle. Cleaned up in `onBeforeUnmount`.

##### 4.2.6.4 CSS

Non-scoped `<style>` block — targets `.scroll-hint` elements outside Vue's
render tree. `.scroll-hint.visible` toggles `display: block`.
