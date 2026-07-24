### 4.4 Theme System

**Brief**: Supports light, dark, and auto (follow OS) color themes using Bootstrap's `data-bs-theme` attribute. Custom brand colors are defined via `--shlh-*` CSS custom properties. Also handles favicon switching between light/dark variants when the theme changes.

**Related Files**:

| File                                          | Role                                                                      |
|-----------------------------------------------|---------------------------------------------------------------------------|
| `src/ui/theme.ts`                             | Theme initialization, switching, system theme listener, and favicon theme |
| `src/stylesheets/theme.css`                   | Theme-specific CSS custom property overrides                              |
| `src/stylesheets/base.css`                    | Base styles including `--bs-border-radius` overrides and shared variables |
| `public/images/svg/favicons/general.svg`      | Light-theme favicon (blue `#3c96ff`)                                      |
| `public/images/svg/favicons/general-dark.svg` | Dark-theme favicon (white)                                                |

**How It Works**:

- Uses Bootstrap's `data-bs-theme` attribute on `<html>`.
- Three modes: `auto` (follow OS), `light`, `dark`.
- System theme changes listened via `matchMedia('(prefers-color-scheme: dark)')`.
- Custom CSS variables prefixed `--shlh-` define brand colors per theme.
- Favicon `<link>` hrefs are swapped between `general.svg` (light) and `general-dark.svg` (dark) by `applyAllFaviconThemes()`.

#### 4.4.1 Color Variable Naming

Color-related CSS custom properties use the `--shlh-*` prefix with the following patterns:

- **Standard**: `--shlh-{type}(-rgb)`
    - Similar to Bootstrap's naming, e.g. `--shlh-primary`, `--shlh-primary-rgb`.
    - Add the `-color` suffix to indicate a foreground color, e.g. `--shlh-primary-color`.
- **Color Brightness**: `--shlh-{type}-{brightness}(-rgb)`
    - **Type**: Similar to Bootstrap, e.g. `primary`, `secondary`.
    - **Brightness**: A number from 100–900 (bright to dark).
    - **Full examples**: `--shlh-primary-500`, `--shlh-primary-500-rgb`.

See [§2.2.1](../../copilot-instructions.md#221-project-specific) for the overall `--shlh-*` prefix definition.

**Data Flow**:

| Mechanism      | Key                      | Purpose                                                  |
|----------------|--------------------------|----------------------------------------------------------|
| `localStorage` | `bsTheme`                | Persist theme preference (`'auto'`, `'light'`, `'dark'`) |
| Global var     | `currentThemePreference` | Current theme choice                                     |


