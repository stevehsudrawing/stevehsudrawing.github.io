---
description: >
  Modal helpers: useModalStack() composable (unified modal stack — push/pop/clear,
  discriminated-union ModalStackItem entries, reactive visibility via useStackModal)
  and useModalFocus() composable (keyboard-aware auto-focus when a BModal opens via
  Tab navigation).  All five modals (Settings, ResetWarning, ExternalLinkConfirm,
  QRCode, GitHubEvents) are rendered in App.vue and coordinated exclusively through
  the stack.
  Use when: modifying modal-to-modal flow, adding a new modal, or keyboard
  accessibility for modals.
applyTo: >
  src/composables/useModalStack.ts;
  src/composables/useModalFocus.ts;
  src/components/modals/*.vue;
  src/types/app.ts
---

#### 4.1.7 Modal Stack

##### 4.1.7.1 Architecture

All modals are siblings rendered in App.vue. Each modal reads its props
and visibility from a **module-level singleton stack** (`useModalStack`).
Only the top entry is visible.

```
App.vue
  ├─ provide(OPEN_SETTINGS_KEY)     -> push({ id: "settings", props: null })
  ├─ provide(OPEN_EXTERNAL_LINK_KEY) -> push({ id: "external-link", props: {...} })
  ├─ provide(OPEN_QR_CODE_KEY)      -> push({ id: "qr-code", props: {...} })
  │
  └─ renders: SettingsModal / ExternalLinkConfirmModal / QRCodeModal
              ResetWarningModal / GitHubEventsModal  (all prop-less)

useModalStack.ts  (module-level singleton)
  ├─ stack: Ref<ModalStackItem[]>
  ├─ top: Computed<ModalStackItem | null>
  ├─ push(item) / pop() / clear()
  └─ useStackModal(id) -> { visible, props }
```

**ModalStackItem** is a discriminated union in `types/app.ts`: `id`
literal narrows `props`. Per-modal props interfaces:
`ExternalLinkConfirmModalProps`, `QRCodeModalProps`, `GitHubEventsModalProps`.
`settings` and `reset-warning` carry `props: null`.

##### 4.1.7.2 Modal Component Pattern

Every modal uses `useStackModal(id)`:

```vue
<script setup lang="ts">
import { useStackModal, useModalStack } from "../../composables/useModalStack";

const { visible, props: stackProps } = useStackModal("external-link");
const { pop } = useModalStack();

// Narrowed computeds for template use
const url = computed(() => stackProps.value?.url ?? "");
</script>

<template>
  <BModal v-model="visible" ...></BModal>
</template>
```

`visible` is a **writable computed**: the getter checks whether this modal
is on top; the setter interprets a `false` write (BModal's backdrop /
Esc close) as `clear()`.

`props` is a **ref with fade-out retention**: while the modal is on top
it mirrors the top entry's props; once the modal leaves the top (pop /
clear / overlaid by another push), the last props are kept for
`MODAL_FADE_MS` (300 ms — matches `.modal.fade .modal-dialog`'s 0.3s
transform/filter transition in `base.css`) and then retired to null.
Without the retention the hide animation would render an empty shell
(derived computeds collapse to their `?? ""` / `?? []` fallbacks the
moment the stack mutates). Re-entering the top within the window
cancels the pending retirement and adopts the new props immediately.

| Trigger             | Stack action                   |
| ------------------- | ------------------------------ |
| `push(item)`        | open modal on top (overlap)    |
| `pop()`             | close top, reveal previous     |
| `clear()`           | dismiss all modals             |
| backdrop / Esc      | `clear()` (via visible setter) |
| Close/Cancel button | `pop()`                        |

Switching is fully reactive — push/pop mutate the stack and each modal's
`visible` computed flips in the same render flush, producing the
External <-> QR overlap timing (outgoing hide + incoming show run
simultaneously; no @hidden sequencing needed).

##### 4.1.7.3 Flow Reference

| Flow                          | Mechanism                                              |
| ----------------------------- | ------------------------------------------------------ |
| External -> QR                | `push({ id: "qr-code", props })` (from External)       |
| QR -> Open Link               | `push({ id: "external-link", props })` — forward push  |
|                               | with `hideQR: false` (mirrors pre-stack behavior)      |
| External link clicked         | App-provided `OPEN_EXTERNAL_LINK_KEY` pushes entry     |
| Settings -> ResetWarning      | `push({ id: "reset-warning", props: null })`           |
| ResetWarning Cancel           | `pop()` back to settings                               |
| ResetWarning Continue         | reset preferences + `clear()` + redirect               |
| Chart click -> events list    | `push({ id: "github-events", props })`                 |
| Events list -> repo link      | TypeAwareLink pushes external-link on top (auto-hides) |
| External navigation confirmed | navigate (window.open / location.href) + `clear()`     |

Navigation logic lives inside `ExternalLinkConfirmModal` itself
(`useLocalStorage(StorageKey.OpenInNewTab)` + window.open). There is no
cross-modal state composable anymore — `useCrossModalNavigation` was
removed in v3.7.0.

##### 4.1.7.4 Adding a New Modal

1. Define a props interface in `types/app.ts` (or `props: null`).
2. Add a union member to `ModalStackItem`.
3. Create the component: `useStackModal("your-id")`, writable computed
   `visible` bound to BModal v-model, Close/Cancel = `pop()`.
4. Render it in App.vue (prop-less).
5. `push` it from wherever it opens.

##### 4.1.7.5 useModalFocus()

Keyboard-aware auto-focus for BModal `@shown` events:

```ts
const langSelectRef = ref<HTMLElement | null>(null);
const { onShown } = useModalFocus(langSelectRef);
// <BModal @shown="onShown" ...>
```

Only transfers focus when `<html>` has `.user-input-keyboard` (the user
was last using Tab/arrow keys). Mouse and touch users are unaffected --
BModal's default focus management works as normal.

| Modal                      | Focus Target        |
| -------------------------- | ------------------- |
| `SettingsModal`            | Language `<select>` |
| `ExternalLinkConfirmModal` | "Open" button       |
| `ResetWarningModal`        | "Cancel" button     |
| `GitHubEventsModal`        | "Close" button      |
| `QRCodeModal`              | (no intervention)   |
