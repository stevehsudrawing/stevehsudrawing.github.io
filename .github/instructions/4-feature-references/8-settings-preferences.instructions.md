---
description: >
  Settings and preferences: user-configurable preferences persisted in localStorage
  (openExternalLinksInNewTab default enabled, enableAnimations default enabled), toggle event
  handling in settings modal, animation preference with OS reduced-motion detection (disables
  toggle when system prefers reduced motion). Interaction with external link confirmation and
  page transitions.
  Use when: modifying settings.ts, adding new preferences, or working with the settings modal.
applyTo: >
  src/ui/settings.ts;
  build/page-components/modals.html
---

### 4.8 Settings & Preferences

**Brief**: Manages user-configurable preferences persisted in `localStorage`.

**Related Files**:

| File                 | Role                                                             |
| -------------------- | ---------------------------------------------------------------- |
| `src/ui/settings.ts` | Preference read/write, toggle event handling, applying behaviors |

**Preferences Managed**:

- **"Always open external links in a new tab"**:
  - `localStorage` key: `openExternalLinksInNewTab`.
  - **Default**: enabled - the preference is considered on unless explicitly set to `'false'`.
  - Controlled by a toggle (`#external-links-new-tab-toggle`) in the settings modal.
  - Key functions:
    - `isExternalLinkNewTabEnabled()` - reads the preference.
    - `setExternalLinkNewTabPreference(enabled)` - persists the preference.
    - `applyAllExternalLinkTargetBehavior()` - reads the preference and delegates to `addExternalLinkTargetBehavior(link)` or `removeExternalLinkTargetBehavior(link)` for each `a.external-link` element.
  - The toggle change event is handled by `initSettingEventListeners()`.
  - When the settings modal opens, `initSettingsModal()` syncs the toggle with the stored preference.

- **"Enable animations"**:
  - `localStorage` key: `enableAnimations`.
  - **Default**: enabled - the preference is considered on unless explicitly set to `'false'`.
  - Controlled by a toggle (`#enable-animations-toggle`) in the settings modal.
  - When disabled, the `applyAnimationPreference()` function adds the `.no-animations` class to `<html>`, which triggers a global CSS rule (in `src/stylesheets/accessibility.css`) that sets `transition: none !important` and `animation: none !important` on all elements.
  - Key functions:
    - `isAnimationEnabled()` - reads the preference.
    - `setAnimationPreference(enabled)` - persists the preference.
    - `applyAnimationPreference()` - toggles the `.no-animations` class on `<html>`.
    - `updateAnimationToggleState()` - checks `matchMedia('(prefers-reduced-motion: reduce)')`; when the OS-level reduced-motion setting is active, disables the toggle (`disabled + unchecked`) and displays a tooltip on the label (i18n key `text-animations-disabled-by-system-description`) explaining that the system setting overrides this option. Listens for changes to the OS setting via `matchMedia(...).addEventListener('change', ...)`.
  - CSS rules (in `src/stylesheets/accessibility.css`): two independent paths disable animations - the `@media (prefers-reduced-motion: reduce)` query (OS-level) and the `.no-animations` class (manual). Both use the same `transition: none !important; animation: none !important` approach.
  - The toggle change event is handled by `initSettingEventListeners()`.
  - When the settings modal opens, `initSettingsModal()` syncs the toggle with the stored preference and system state.

**Data Flow**:

| Mechanism      | Key                         | Purpose                                  |
| -------------- | --------------------------- | ---------------------------------------- |
| `localStorage` | `openExternalLinksInNewTab` | Persist external link new-tab preference |
| `localStorage` | `enableAnimations`          | Persist animation preference             |

> Language and theme preferences are managed by their respective modules (see [§4.3](3-internationalization-i18n.instructions.md#43-internationalization-i18n) and [§4.4](4-theme-system.instructions.md#44-theme-system)).

**Interaction with Other Systems**:

- **i18n ([§4.3](3-internationalization-i18n.instructions.md#43-internationalization-i18n))**: The language selector (`#language-select`) in the settings modal triggers `loadLang()` on change.
- **Theme ([§4.4](4-theme-system.instructions.md#44-theme-system))**: Theme buttons (`.theme-item`) in the settings modal call `setThemePreference()` on click.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.instructions.md#417-external-link-confirmation))**: The `openExternalLinksInNewTab` preference is shared between the settings modal toggle (`#external-links-new-tab-toggle`) and the confirmation modal toggle (`#external-link-new-tab-toggle`). The confirmation module calls `isExternalLinkNewTabEnabled()` / `setExternalLinkNewTabPreference()` / `applyAllExternalLinkTargetBehavior()` from this module.
- **Page Transition ([§4.6](6-page-transitions.instructions.md#46-page-transitions))**: `initSettingsModal()` is re-invoked after each SPA transition (via `initPageContent()`) to re-sync toggle DOM elements with stored preferences.
