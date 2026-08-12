---
description: >
  Copy Protection: platform/no-copy.ts (contextmenu + dragstart event delegation),
  .no-copy CSS in stylesheets/base.css.
  Use when: modifying copy-protection behavior or the .no-copy CSS class.
applyTo: >
  src/platform/no-copy.ts;
  src/stylesheets/base.css
---

#### 4.2.7 Copy Protection

##### 4.2.7.1 initNoCopyProtection()

```
onMounted -> init()
  └─ document.addEventListener("contextmenu", handler)
  └─ document.addEventListener("dragstart", handler)

onBeforeUnmount -> removeEventListener for both
```

Called from `App.vue` onMounted. Event handlers check `(e.target).closest(".no-copy")` — if matched, `e.preventDefault()`.

##### 4.2.7.2 .no-copy CSS

Defined in `stylesheets/base.css`.

##### 4.2.7.3 CSS

Non-scoped `<style>` block:

```css
.no-copy {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
}
```
