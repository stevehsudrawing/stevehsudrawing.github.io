---
description: >
  Theme system: light/dark/auto color themes via Bootstrap data-bs-theme attribute, useTheme()
  composable (preference + effectiveTheme), --shlh-* CSS custom properties, favicon switching.
  Use when: modifying theme colors, useTheme.ts, theme.ts, theme.css, or favicon assets.
applyTo: >
  src/composables/useTheme.ts;
  src/ui/theme.ts;
  src/stylesheets/global/theme.css
---

#### 4.1.2 Theme System

##### 4.1.2.1 Architecture

```
useTheme() composable          ui/theme.ts (legacy bridge)
  ├─ preference: Ref<ThemeChoice>   ├─ initThemePreference()
  ├─ effectiveTheme: Computed       ├─ applyThemePreference()
  └─ setPreference(choice)          ├─ setThemePreference()
       │                            ├─ initSystemThemeListener()
       └──► delegates to             └─ initThemeTransitionOverlay()
            ui/theme.ts
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

| File                  | How                                                     |
| --------------------- | ------------------------------------------------------- |
| `App.vue`             | `useTheme()` (root), `initThemeTransitionOverlay()`     |
| `AppNavbar.vue`       | `useTheme()` → `preference`, `setPreference()`          |
| `SettingsModal.vue`   | `useTheme()` → `preference`, `setPreference()`          |
| `QRCodeModal.vue`     | `useTheme()` → `effectiveTheme` for QR color adaptation |
| `FeatureAwareImg.vue` | `useTheme()` → `effectiveTheme` for src swap            |

##### 4.1.2.5 Theme Transition

`.theme-transition-overlay` (in App.vue template) provides a brief flash
overlay during theme switches to prevent jarring color transitions.
