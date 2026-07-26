---
description: >
  CSS custom properties naming: --shlh-* prefix for project-specific variables (colors, fonts),
  --bs-* prefix for Bootstrap overrides.
  Use when: adding CSS custom properties, defining theme colors, or setting font stacks.
applyTo: >
  src/stylesheets/**;
  public/legacy/*.css
---

### 2.2 CSS Custom Properties

#### 2.2.1 Project-specific

Prefix `--shlh-*` (short for **S**teve **H**su's **L**ink-**H**ub). These variables cover two domains; their detailed naming conventions are documented in the relevant feature sections:

- **Color variables** - naming and brightness scale defined in [§4.4 Theme System](../4-feature-references/4-theme-system.instructions.md).
- **Font variables** - naming, categories, priorities, and languages defined in [§4.11 Fonts & Typography](../4-feature-references/11-fonts-typography.instructions.md).

#### 2.2.2 Bootstrap overrides

Prefix `--bs-*`. See [its documentation](https://getbootstrap.com/docs/5.3/customize/css-variables/) for more information. e.g. `--bs-border-radius`, `--bs-link-hover-color`

Although all `--bs-border-radius*` settings in `src/stylesheets/base.css` are 0px, it's still best to choose the border-radius size according to Bootstrap conventions.
