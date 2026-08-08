---
description: >
  Settings & preferences: SettingsModal.vue (theme, language, new-tab, animations toggles),
  useLocalStorage() composable (ref ↔ localStorage), StorageKey enum, ResetWarningModal
  confirmation flow.  Use when: modifying settings UI, localStorage keys, or preference logic.
applyTo: >
  src/components/modals/SettingsModal.vue;
  src/components/modals/ResetWarningModal.vue;
  src/composables/useLocalStorage.ts
---

#### 4.1.3 Settings & Preferences

##### 4.1.3.1 StorageKey Enum

All localStorage keys are defined in `src/types/app.ts`:

```ts
export const enum StorageKey {
  Theme = "bsTheme",
  Lang = "preferredLang",
  OpenInNewTab = "openExternalLinksInNewTab",
  EnableAnimations = "enableAnimations",
}
```

Always use `StorageKey.XXX` — never bare strings.

##### 4.1.3.2 useLocalStorage() Composable

```ts
const value = useLocalStorage(StorageKey.OpenInNewTab, true);
// value is Ref<boolean>, auto-synced with localStorage
```

Handles legacy plain-string values via try/catch `JSON.parse`.

##### 4.1.3.3 SettingsModal Architecture

```
SettingsModal.vue
  ├─ visible: ref<boolean>  (defineExpose: show/hide)
  ├─ locale: Ref<Lang>         -> useI18n()
  ├─ themePreference           -> useTheme()
  ├─ openInNewTab              -> useLocalStorage(StorageKey.OpenInNewTab)
  ├─ enableAnimations          -> useLocalStorage(StorageKey.EnableAnimations)
  └─ reducedMotion             -> matchMedia("(prefers-reduced-motion: reduce)")
       │
       └── ResetWarningModal.vue (modal-to-modal switching)
            └─ emit("confirm") -> resetAll() -> redirect to /index.html
```

##### 4.1.3.4 Modal-to-Modal Switching

SettingsModal ↔ ResetWarningModal uses the `pendingResetWarning` flag:

1. User clicks "Reset" -> `openResetWarning()` sets flag, hides SettingsModal
2. `@hidden` -> `onSettingsHidden()` shows ResetWarningModal
3. Cancel -> `onResetCancel()` re-shows SettingsModal
4. Confirm -> `resetAll()` clears all prefs, redirects

##### 4.1.3.5 Open from App.vue

App.vue listens for `click` on `[data-settings-open]` and calls
`settingsModalRef.value?.show()`.
