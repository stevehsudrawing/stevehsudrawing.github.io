---
description: >
  Copy Protection: CopyProtectedImg.vue (contextmenu + dragstart delegation on .no-copy),
  no-copy.ts bridge (window.__noCopy).  CSS: .no-copy class.
  Use when: modifying copy-protection behavior or the .no-copy CSS class.
applyTo: >
  src/components/ui/CopyProtectedImg.vue;
  src/ui/no-copy.ts
---

#### 4.2.8 Copy Protection

##### 4.2.8.1 CopyProtectedImg.vue

```
onMounted -> init()
  └─ document.addEventListener("contextmenu", handler)
  └─ document.addEventListener("dragstart", handler)

onBeforeUnmount -> removeEventListener for both
```

Event handlers check `(e.target).closest(".no-copy")` -- if matched, `e.preventDefault()`.

Expose: `defineExpose({ init })` -- idempotent re-init for SPA transitions.

##### 4.2.8.2 no-copy.ts Bridge

Thin wrapper delegating to `window.__noCopy`.

##### 4.2.8.3 CSS

Non-scoped `<style>` block:

```css
.no-copy {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}
```
