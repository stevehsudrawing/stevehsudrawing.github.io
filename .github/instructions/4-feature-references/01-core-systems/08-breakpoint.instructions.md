---
description: >
  Breakpoint detection: useBreakpoint() composable providing a shared reactive
  Breakpoint ref (mobile ≤ 992 px / tablet ≤ 1200 px / desktop > 1200 px),
  aligned with Bootstrap's lg and xl thresholds.  Module-level singleton with
  ref-counted resize listener and requestAnimationFrame throttling.
  Use when: modifying responsive layout logic, adding new breakpoint-dependent
  components, or changing breakpoint thresholds.
applyTo: >
  src/composables/useBreakpoint.ts;
  src/types/app.ts
---

#### 4.1.8 Breakpoint Detection

##### 4.1.8.1 Architecture

```
useBreakpoint() composable
  └─ breakpoint: Ref<Breakpoint>  (module-level singleton)
       ├─ "mobile"  — ≤ 992 px  (Bootstrap lg)
       ├─ "tablet"  — ≤ 1200 px (Bootstrap xl)
       └─ "desktop" — > 1200 px
```

- **Singleton**: all components share one `Ref<Breakpoint>` and one global resize listener.
- **Ref-counted listener**: registered on first `onMounted`, removed on last `onBeforeUnmount`.
- **Throttled**: resize events are throttled via `requestAnimationFrame`.

##### 4.1.8.2 Breakpoint type

```ts
// src/types/app.ts
export type Breakpoint = "mobile" | "tablet" | "desktop";
```

##### 4.1.8.3 Consumers

| File                  | How                                                    |
| --------------------- | ------------------------------------------------------ |
| `IndexPage.vue`       | `useBreakpoint()` → `breakpoint !== 'mobile'` for hero |
| `AppNavbar.vue`       | `useBreakpoint()` → brand slide animation control      |
| `MarkdownArticle.vue` | `useBreakpoint()` → mobile vs desktop scrollspy        |

##### 4.1.8.4 Relation to CSS breakpoints

The JS breakpoint thresholds mirror Bootstrap's CSS media queries:

| Tier    | JS condition         | CSS equivalent                                         |
| ------- | -------------------- | ------------------------------------------------------ |
| mobile  | `width ≤ 992`        | `@media (max-width: 991.98px)`                         |
| tablet  | `992 < width ≤ 1200` | `@media (min-width: 992px) and (max-width: 1199.98px)` |
| desktop | `width > 1200`       | `@media (min-width: 1200px)`                           |

When a conditional can be expressed purely in CSS (e.g. layout changes), prefer
CSS media queries over JS breakpoint detection. Use `useBreakpoint()` only when
the logic requires JS-level branching (e.g. conditional event handlers, dynamic
prop computation).

##### 4.1.8.5 Touch / input modality

Touch vs pointer detection is **not** part of this composable. Input modality
is handled separately by `initInputModalityDetection()` in
`src/platform/accessibility.ts`, which sets `.user-input-touch`,
`.user-input-pointer`, and `.user-input-keyboard` classes on `<html>`.
