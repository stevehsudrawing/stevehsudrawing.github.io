---
description: >
  HTML/CSS naming conventions: element IDs (dash-case), CSS classes (dash-case),
  custom data-* attributes (dash-case), Bootstrap classes (use Bootstrap-native naming).
  Use when: writing HTML, adding CSS classes, or creating custom data attributes.
applyTo: >
  **/*.html;
  src/stylesheets/**;
  public/legacy/*.css
---

### 2.1 HTML / CSS

| Category          | Convention / Constraint     | Examples                                                            |
| ----------------- | --------------------------- | ------------------------------------------------------------------- |
| Element IDs       | `dash-case`                 | `#page-content`, `#skip-button`, `#language-select`                 |
| CSS classes       | `dash-case`                 | `.loading-screen`, `.link-button-group`                             |
| Custom attributes | `data-*` with `dash-case`   | `data-bs-theme`, `data-i18n`, `data-i18n-html`, `data-i18n-tooltip` |
| Bootstrap classes | Use Bootstrap-native naming | `.btn-primary`, `.dropdown-menu`, etc.                              |
