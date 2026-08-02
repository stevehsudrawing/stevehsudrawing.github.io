---
description: >
  Modal focus management: centralized Bootstrap modal focus restoration and default-focus
  assignment via .default-keyboard-focus CSS class. Uses document-level delegated listeners
  for show.bs.modal (capture trigger), hidden.bs.modal (restore focus), and shown.bs.modal
  (auto-focus declared element). Eliminates per-modal boilerplate.
  Use when: modifying modal.ts, adding new modals, changing default-focus targets, or
  debugging modal keyboard accessibility.
applyTo: >
  src/ui/modal.ts;
  build/page-components/modals.html;
  src/main.ts
---

### 4.20 Modal Focus Management

**Brief**: Centralized focus management for all Bootstrap modals. Captures the trigger element before a modal opens, restores focus when it closes, and auto-focuses an element marked with `.default-keyboard-focus` inside the newly shown modal.

**Related Files**:

| File                                | Role                                               |
| ----------------------------------- | -------------------------------------------------- |
| `src/ui/modal.ts`                   | Centralized focus capture, restore, and auto-focus |
| `build/page-components/modals.html` | Contains `.default-keyboard-focus` declarations    |
| `src/main.ts`                       | Calls `initModalFocusManagement()` once at startup |

**How It Works**:

```
show.bs.modal (document delegated)
  → Captures document.activeElement as triggerElement

Modal transition completes...

shown.bs.modal (document delegated)
  → e.target = the .modal element
  → modal.querySelector(".default-keyboard-focus")?.focus()

User presses Esc / clicks Close / clicks backdrop...

hidden.bs.modal (document delegated)
  → If triggerElement.isConnected → triggerElement.focus()
  → triggerElement = null
```

- All listeners are registered on `document` via event delegation, so they work for any Bootstrap modal regardless of how it was opened (programmatic or data-attribute).
- `show.bs.modal` fires **before** the modal is shown, so `document.activeElement` still points to the page element that triggered the modal.
- `hidden.bs.modal` fires after the hide transition completes. The `isConnected` check prevents focusing an element that was removed from the DOM (e.g., after a page transition).
- For **chained modals** (ext-link-confirm → QR, or QR → ext-link-confirm), the natural event ordering ensures the original page trigger is always correctly captured.
- The `triggerElement` module-level variable is intentionally **not reset** between `show.bs.modal` and `hidden.bs.modal`; it is only reset after restore.

#### 4.20.1 `.default-keyboard-focus` CSS Class

A project-specific convention class (no CSS rules - purely a JS selector) that marks which element in a modal should receive focus when the modal opens.

**Usage** (in `build/page-components/modals.html`):

```html
<!-- Settings modal: focus the language dropdown -->
<select class="form-select default-keyboard-focus" id="language-select">
  <!-- External link confirmation: focus the primary action -->
  <button
    class="btn btn-outline-primary btn-no-border default-keyboard-focus"
    id="external-link-open-btn"
  >
    Open
  </button>

  <!-- Warning-reset modal: focus the safe default -->
  <button
    class="btn btn-outline-secondary btn-no-border default-keyboard-focus"
    data-bs-toggle="modal"
    data-bs-target="#settings-modal"
  >
    Cancel
  </button>
</select>
```

**Rules**:

- Only one element per modal should carry this class.
- The class has no visual effect - it is only used as a query selector.
- If no element in a modal has this class (e.g., QR code modal), no auto-focus occurs.
- Naming follows `dash-case` convention, consistent with other project behavior classes like `.no-copy`.

#### 4.20.2 Current Default-Focus Assignments

| Modal                 | Target Element            | Rationale                                          |
| --------------------- | ------------------------- | -------------------------------------------------- |
| External Link Confirm | `#external-link-open-btn` | Primary action; Enter to proceed                   |
| Settings              | `#language-select`        | First form control; immediate keyboard interaction |
| Warning Reset         | Cancel button             | Safe default for destructive action confirmation   |
| QR Code               | _(none)_                  | QR code is visual content; no clear primary action |

#### 4.20.3 Key Function

- `initModalFocusManagement()` - Registers the three delegated event listeners on `document`. Called once in `src/main.ts` during application initialization, before any modal can be opened. Has no corresponding `dispose*` function since it persists for the lifetime of the page.

#### 4.20.4 Interaction with Other Systems

- **External Link Confirmation ([§4.17](17-external-link-confirmation.instructions.md#417-external-link-confirmation))**: No longer manages its own focus - the `hidden.bs.modal` and `shown.bs.modal` listeners in `showExternalLinkConfirmation()` have been removed in favor of the centralized system.
- **QR Code ([§4.10](10-qr-code-export.instructions.md#410-qr-code--export))**: Same - own focus-restore listener removed.
- **Settings ([§4.8](8-settings-preferences.instructions.md#48-settings--preferences))**: Same - own focus-restore and auto-focus listeners removed. The warning-reset modal's auto-focus listener in `initSettingsModal()` has also been removed.
- **Navigation & Accessibility ([§4.9](9-navigation-accessibility.instructions.md#49-navigation--accessibility))**: Complements the skip-button and keyboard-mode detection; together they form the keyboard accessibility layer.
