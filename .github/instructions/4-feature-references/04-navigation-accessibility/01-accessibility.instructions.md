---
description: >
  Accessibility: skip-to-content button, keyboard vs mouse focus distinction
  (.user-input-keyboard), reduced-motion / reduced-transparency / high-contrast
  media queries, hash-based scroll.  BModal built-in focus management.
  Use when: modifying accessibility features, focus management, or CSS media queries.
applyTo: >
  src/platform/accessibility.ts;
  src/components/buttons/SkipButton.vue;
  src/stylesheets/global/accessibility.css
---

#### 4.4.1 Accessibility

##### 4.4.1.1 Skip-to-Content Button

`SkipButton.vue` (rendered in App.vue template) provides a keyboard-accessible
link to `#page-content`. Visible on `:focus`. Styled by `#skip-button` rules
in `accessibility.css`.

##### 4.4.1.2 Input Modality Detection

`initInputModalityDetection()` (in `accessibility.ts`, called from
App.vue's `onMounted`) toggles `.user-input-keyboard`, `.user-input-pointer`,
and `.user-input-touch` classes on `<html>` based on the user's last
input method. CSS uses these for conditional focus outlines (see
`accessibility.css`).

##### 4.4.1.3 Reduced Motion / Transparency / Contrast

CSS media queries in `accessibility.css`:

- `prefers-reduced-motion: reduce` -- disables animations
- `prefers-reduced-transparency: reduce` -- removes transparency
- `prefers-contrast: high` / `more` -- increases contrast

##### 4.4.1.4 Modal Focus Management

Legacy `ui/modal.ts` deleted in Phase 5. `<BModal>` from `bootstrap-vue-next`
handles focus restoration and `.default-keyboard-focus` natively.

##### 4.4.1.5 Hash-Based Scroll

`initHashChangeScroll()` scrolls to `location.hash` target after page load
and SPA transitions.
