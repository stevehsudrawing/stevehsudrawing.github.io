---
description: >
  Navigation and accessibility: navbar active state highlighting, scroll hint indicator with
  create/remove lifecycle, skip-to-content button for keyboard users, keyboard vs mouse focus
  distinction (.user-input-keyboard), CSS accessibility adaptations (reduced motion, reduced
  transparency, high contrast media queries).
  Use when: modifying navbar, scroll hints, skip button, or accessibility CSS.
applyTo: >
  src/ui/navbar.ts;
  src/ui/scroll-hint.ts;
  src/ui/accessibility.ts;
  src/stylesheets/navbar.css;
  src/stylesheets/scroll-hint.css;
  src/stylesheets/accessibility.css
---

### 4.9 Navigation & Accessibility

**Brief**: Handles navbar active state, scroll hint indicator, skip-to-content button, keyboard/mouse focus distinction, and CSS-based accessibility adaptations (reduced motion, reduced transparency, high contrast).

**Related Files**:

| File                                | Role                                                                                     |
| ----------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/ui/navbar.ts`                  | Active nav item highlighting                                                             |
| `src/ui/scroll-hint.ts`             | Scroll-down hint indicator                                                               |
| `src/ui/accessibility.ts`           | Skip button, focus management, external link indicators, title link anchors              |
| `src/stylesheets/navbar.css`        | Navbar styles                                                                            |
| `src/stylesheets/scroll-hint.css`   | Scroll hint styles                                                                       |
| `src/stylesheets/accessibility.css` | Base accessibility rules (motion, transparency, contrast), skip button, and focus styles |

**Features**:

- **CSS-based accessibility adaptations** (in `src/stylesheets/accessibility.css`, "Base Accessibility" section):
  - **Disable all transitions & animations**: Two independent paths - the `@media (prefers-reduced-motion: reduce)` query (OS-level) and the `.no-animations` class (manual, toggled via the "Enable animations" setting in [§4.8](8-settings-preferences.instructions.md#48-settings--preferences)). Both set `transition: none !important; animation: none !important` on all elements and their `::before`/`::after` pseudo-elements.
  - **Disable Transparency**: Responds to the `@media (prefers-reduced-transparency: reduce)` query by forcing full opacity on tooltips (`--bs-tooltip-opacity: 1`), removing `backdrop-filter` from the navbar and modal backdrop, and using opaque `background-color` fallbacks.
  - **High Contrast**: Responds to the `@media (prefers-contrast: more)` query by using stark black/white border and secondary colors, forcing `hr` opacity to 1, adding a visible border-box shadow to `.navbar-scrolled`, enforcing a visible border on `.btn-no-border`, and in dark mode using a black body background with white borders.
- **Skip button** (`#skip-button`): Allows keyboard users to skip navigation and jump to main content.
- **Focus management**: CSS distinguishes keyboard focus (`.user-input-keyboard #skip-button:focus`) from mouse focus (`:focus-visible`).
- **Language attribute**: The `lang` attribute on `<html>` should reflect the current language.
