---
description: >
  Settings & preferences: SettingsModal.vue (theme, language, new-tab, animations
  toggles), storage accessors (platform/storage.ts), useStoredValue() composable
  (ref ↔ storage), StorageKey enum, ResetWarningModal confirmation flow.
  Use when: modifying settings UI, localStorage keys, or preference logic.
applyTo: >
  src/components/modals/SettingsModal.vue;
  src/components/modals/ResetWarningModal.vue;
  src/composables/useStoredValue.ts;
  src/platform/storage.ts
---

#### 4.1.3 Settings & Preferences

##### 4.1.3.1 StorageKey Enum

All localStorage keys are defined in `src/types/app.ts`:

```ts
export const enum StorageKey {
  Theme = "theme",
  Lang = "lang",
  OpenInNewTab = "openInNewTab",
  EnableAnimations = "enableAnimations",
  GithubProfile = "githubProfile",
  GithubEvents = "githubEvents",
}
```

Always use `StorageKey.XXX` — never bare strings.

##### 4.1.3.2 Storage Accessors (MANDATORY)

**Every** localStorage key MUST have a typed getter/setter accessor pair
(`getStoredX` / `setStoredX`) in `src/platform/storage.ts`. Raw
`localStorage` usage outside `storage.ts` is forbidden — including
composables, components, and build scripts.

| Value kind          | Storage format       |
| ------------------- | -------------------- |
| String preferences  | plain string         |
| Boolean preferences | `"true"` / `"false"` |
| GitHub API caches   | JSON `CacheEntry<T>` |

All accessors validate on read and fail closed to a safe default
(e.g. `getStoredTheme()` -> `"auto"`, `getStoredLang()` -> `"en"`).
GitHub caches expose `GITHUB_PROFILE_CACHE` / `GITHUB_EVENTS_CACHE`
accessor objects for `useGithubApi()`.

##### 4.1.3.3 useStoredValue() Composable

```ts
const value = useStoredValue(
  getStoredOpenInNewTab,
  setStoredOpenInNewTab,
  true,
);
// value is Ref<boolean>, auto-synced with storage via the accessors
```

Reactive binding over an accessor pair; module-level singleton per getter
function. Only pass real accessors from `platform/storage.ts` — never
ad-hoc lambdas that touch localStorage.

##### 4.1.3.4 SettingsModal Architecture

```
SettingsModal.vue
  ├─ visible: ref<boolean>  (defineExpose: show/hide)
  ├─ locale: Ref<Lang>         -> useI18n()
  ├─ themePreference           -> useTheme()
  ├─ openInNewTab              -> useStoredValue(getStoredOpenInNewTab, ...)
  ├─ enableAnimations          -> useStoredValue(getStoredEnableAnimations, ...)
  └─ reducedMotion             -> matchMedia("(prefers-reduced-motion: reduce)")
       │
       └── ResetWarningModal.vue (modal-to-modal switching)
            └─ emit("confirm") -> resetAll() -> redirect to /index.html
```

##### 4.1.3.5 Modal-to-Modal Switching

SettingsModal ↔ ResetWarningModal uses the `pendingResetWarning` flag:

1. User clicks "Reset" -> `openResetWarning()` sets flag, hides SettingsModal
2. `@hidden` -> `onSettingsHidden()` shows ResetWarningModal
3. Cancel -> `onResetCancel()` re-shows SettingsModal
4. Confirm -> `resetAll()` clears all prefs, redirects

##### 4.1.3.6 Open from App.vue

App.vue listens for `click` on `[data-settings-open]` and calls
`settingsModalRef.value?.show()`.
