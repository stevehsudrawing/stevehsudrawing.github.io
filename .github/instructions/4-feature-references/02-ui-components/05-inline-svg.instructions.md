---
description: >
  Inline SVG: InlineSvg.vue (fetch SVG -> inject inline).
  SVG conventions: fill="currentColor" placeholder, include viewBox.
  Use when: adding SVG assets or modifying SVG injection logic.
applyTo: >
  src/components/ui/InlineSvg.vue
---

#### 4.2.5 Inline SVG

##### 4.2.5.1 InlineSvg.vue Props

| Prop       | Type      | Purpose                                       |
| ---------- | --------- | --------------------------------------------- |
| `src`      | `string`  | SVG file URL                                  |
| `width`    | `number?` | Width override (px)                           |
| `height`   | `number?` | Height override (px)                          |
| `colorVar` | `string?` | CSS variable to replace `fill="currentColor"` |

Usage:

```vue
<InlineSvg
  src="/images/svg/icons/steve-hsu.svg"
  :width="32"
  color-var="bs-primary"
/>
```

##### 4.2.5.2 injectSVG() Logic

`injectSVG()` is a module-level helper in `InlineSvg.vue`:

1. Guard: skip if `<svg>` already injected
2. `fetch(src)` -> `response.text()`
3. If `colorVar`: replace `fill="currentColor"` with `fill="var(--{colorVar})"`
4. Set `width`/`height` on `<svg>` tag
5. Set `innerHTML` of placeholder

##### 4.2.5.3 SVG File Conventions

- Must use `fill="currentColor"` as placeholder for dynamic coloring
- Must include `viewBox` attribute
- Must NOT hardcode `width`/`height`
