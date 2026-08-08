---
description: >
  Theme system: light/dark/auto color themes via Bootstrap data-bs-theme attribute, useTheme()
  composable (preference + effectiveTheme), --shlh-* CSS custom properties, favicon switching.
  Use when: modifying theme colors, useTheme.ts, theme.ts, theme.css, or favicon assets.
applyTo: >
  src/composables/useTheme.ts;
  src/platform/theme.ts;
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

##### 4.1.2.4 Consumers

| File                  | How                                                      |
| --------------------- | -------------------------------------------------------- |
| `App.vue`             | `useTheme()` (root)                                      |
| `AppNavbar.vue`       | `useTheme()` -> `preference`, `setPreference()`          |
| `SettingsModal.vue`   | `useTheme()` -> `preference`, `setPreference()`          |
| `QRCodeModal.vue`     | `useTheme()` -> `effectiveTheme` for QR color adaptation |
| `FeatureAwareImg.vue` | `useTheme()` -> `effectiveTheme` for src swap            |

##### 4.1.2.5 Theme Transition

`.theme-transition-overlay` is created dynamically by `applyThemePreference()`
when the user switches themes. It provides a brief full-page crossfade
(500 ms fade-in, switch theme, 1000 ms fade-out) and is then removed from
the DOM. This avoids permanent `backdrop-filter` compositing overhead in
Chromium on Windows.
