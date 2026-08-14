# TODO — v3.7.0 Modal Stack (Breaking Change)

Replace ad-hoc modal coordination with a unified modal stack.
All modal switches use the `nextTick` overlap timing (proven by the
External <-> QR flow). Backdrop click / Esc clears the stack; in-modal
Close/Cancel buttons pop one level.

## 1. Types & core

- [x] Add per-modal props interfaces to `types/app.ts`:
  - `ExternalLinkConfirmModalProps` (url, pictureProps, coloredProps, hideQR)
  - `QRCodeModalProps` (url, pictureProps, coloredProps, hideOpenLink)
  - `GitHubEventsModalProps` (title, events)
- [x] Add `ModalStackItem` discriminated union (`id` literal + `props`):
  - `external-link` / `qr-code` / `github-events` / `settings` / `reset-warning`
  - `settings` and `reset-warning` carry `props: null`
- [x] Create `src/composables/useModalStack.ts`:
  - Module-level `stack: Ref<ModalStackItem[]>` + `top` computed
  - `push(item)` / `pop()` / `clear()`
  - Reactive switching — the visible computed flips in the same render
    flush, producing the nextTick-overlap timing naturally
  - Fade-out props retention — `useStackModal` keeps the last props
    for `MODAL_FADE_MS` (300ms) after the modal leaves the top, so the
    hide animation never renders an empty shell

## 2. App.vue integration

- [x] Lift `ResetWarningModal` from `SettingsModal` to `App.vue`
- [x] Lift `GitHubEventsModal` (new) to `App.vue`
- [x] Stack-driven rendering: each modal's `visible` derived from `top`
- [x] Delete `src/composables/useCrossModalNavigation.ts` — its three
      responsibilities are absorbed by the stack:
  - props refs -> `ModalStackItem.props` embedded in stack items
  - `onExtLinkShowQR` -> `stack.push({ id: "qr-code", props })`
  - `onQROpenLink` -> `push({ id: "external-link", props })` with
    `hideQR: false` (forward push — mirrors pre-stack behavior where
    Open Link always switched to the external confirm modal, regardless
    of how the QR modal was opened)
  - `onExtLinkNavigate` -> moves into `ExternalLinkConfirmModal` itself
    (it already holds `url` + `openInNewTab`)
- [x] Remove `pendingResetWarning` flag + `@hidden` sequencing from `SettingsModal`
- [x] Backdrop / Esc = `clear()` (keep BModal default close behavior,
      writable-computed setter interprets `false` as `clear()`)

## 3. Modal component migration

- [x] `ExternalLinkConfirmModal.vue`: derived `visible`; Cancel = `pop()`
- [x] `QRCodeModal.vue`: derived `visible`; Close = `pop()`
- [x] `SettingsModal.vue`: derived `visible`; Close = `pop()`; Reset button pushes `reset-warning`
- [x] `ResetWarningModal.vue`: derived `visible`; Cancel = `pop()`
- [x] `GitHubEventsModal.vue` (new): events list, reverse chronological,
      icon + description + relative time per item

## 4. Chart click -> events modal

- [x] `GitHubActivityStatsCard.vue`: Chart.js `onClick` handlers
  - Bar mode: `elements[0].index` -> event type -> filtered events
  - Line mode: `elements[0].index` -> timestamp -> day string -> filtered events
  - Push `github-events` onto the stack
- [x] `onHover` -> `cursor: pointer` feedback on hoverable elements
- [x] Event description i18n templates (en / zh-Hans / zh-Hant):
  - push (with/without size), watch, issue-opened, issue-closed,
    issue-comment, create, fork, pull-request, delete, other
- [x] `PushEvent` defensive `payload.size` handling (fallback template)
- [x] Repo / issue links via `TypeAwareLink` (external confirm flow,
      stack auto-hides the events modal)

## 5. Docs & verification

- [x] Rewrite `.github/instructions/4-feature-references/01-core-systems/07-modal-helpers.instructions.md`
- [x] Update `.github/instructions/4-feature-references/01-core-systems/09-github-api.instructions.md`
- [x] `pnpm typecheck ; pnpm build`
