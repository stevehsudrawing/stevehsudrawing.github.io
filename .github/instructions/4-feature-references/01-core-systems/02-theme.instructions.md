---
description: >
  Theme system: light/dark/auto color themes via Bootstrap data-bs-theme attribute, useTheme()
  composable (preference + effectiveTheme), --shlh-* CSS custom properties, favicon switching.
  Use when: modifying theme colors, useTheme.ts, theme.ts, theme.css, or favicon assets.
applyTo: >
  src/composables/useTheme.ts;
  src/platform/theme.ts;
  src/platform/css-var.ts;
  src/stylesheets/global/theme.css
---

#### 4.1.2 Theme System

##### 4.1.2.1 Architecture

```
useTheme() composable              platform/theme.ts
  ├─ preference: Ref<ThemeChoice>     ├─ applyThemePreference()
  ├─ effectiveTheme: Computed         ├─ applyThemeChange()
  └─ setPreference(choice)            ├─ initSystemThemeListener()
       │                              └─ applyAllFaviconThemes()
       └──► delegates to
            platform/theme.ts
```

##### 4.1.2.2 Theme Choices

| Value   | Meaning              | Resolved to      |
| ------- | -------------------- | ---------------- |
| `auto`  | Follow OS preference | `light` / `dark` |
| `light` | Always light         | `light`          |
| `dark`  | Always dark          | `dark`           |

##### 4.1.2.3 CSS Custom Properties

Project-specific variables use `--shlh-*` prefix:

- `--shlh-primary` through `--shlh-primary-900`
- `--shlh-primary-*-rgb` variants for alpha compositing

Bootstrap overrides use `--bs-*` prefix.

**Programmatic access**: use `cssVar()` from `src/platform/css-var.ts` to read
CSS custom properties at runtime (e.g. for Chart.js / canvas colours). The
first argument is the **bare property name** (without `--`); the `--` prefix
is added internally. A fallback value is required — mirroring i18n's `t()`.

```typescript
import { cssVar } from "../platform/css-var";

// Return value if set, fallback otherwise
const primary = cssVar("shlh-primary", "#6f42c1");
const primaryRgb = cssVar("shlh-primary-500-rgb", "111,66,193");
const gridColor = cssVar("bs-border-color", "#dee2e6");
const textColor = cssVar("bs-body-color", "#212529");
```

CSS custom properties are **not reactive** (`getComputedStyle` returns a
snapshot). To respond to theme changes, re-read after `effectiveTheme` flips
(e.g. via `watch(effectiveTheme, ...)` or chart rebuild).

| Consumer                      | Properties read                                                            |
| ----------------------------- | -------------------------------------------------------------------------- |
| `GitHubActivityStatsCard.vue` | `shlh-primary`, `shlh-primary-500-rgb`, `bs-border-color`, `bs-body-color` |
| `QRCodeModal.vue`             | `bs-body-color`, `bs-body-bg`                                              |

##### 4.1.2.4 Consumers

| File                      | How                                                      |
| ------------------------- | -------------------------------------------------------- |
| `App.vue`                 | `useTheme()` (root)                                      |
| `AppNavbar.vue`           | `useTheme()` -> `preference`, `setPreference()`          |
| `SettingsModal.vue`       | `useTheme()` -> `preference`, `setPreference()`          |
| `QRCodeModal.vue`         | `useTheme()` -> `effectiveTheme` for QR color adaptation |
| `FeatureAwarePicture.vue` | `useTheme()` -> `effectiveTheme` for src swap            |

##### 4.1.2.5 Theme Transition

`.theme-transition-overlay` is created dynamically by `applyThemePreference()`
when the user switches themes. It provides a brief full-page crossfade
(500 ms fade-in, switch theme, 1000 ms fade-out) and is then removed from
the DOM. This avoids permanent `backdrop-filter` compositing overhead in
Chromium on Windows.
