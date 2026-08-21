---
description: >
  Navbar: AppNavbar.vue (fixed-top nav with brand, links, BDropdown for language/theme),
  OffcanvasNav.vue (mobile sidebar), useGesture.ts (left-edge right-swipe to open +
  right-edge left-swipe to close offcanvas on mobile+touch).  Covers active nav-item
  highlighting, mobile brand scroll swap, scroll border, swipe gestures, and dropdown menus.
  Use when: modifying navigation, navbar layout, swipe gestures, or dropdown behavior.
applyTo: >
  src/components/nav/AppNavbar.vue;
  src/components/nav/OffcanvasNav.vue;
  src/composables/useGesture.ts
---

#### 4.2.1 Navbar

##### 4.2.1.1 Architecture

```
AppNavbar.vue (one-shot Vue render)
  ├─ Props: currentPage: string
  ├─ State: navItems, composables (useGesture, useBreakpoint, etc.), scroll state, theme options, dropdown labels
  └─ Actions: switchLanguage(), scroll/resize handlers
       │
       ├── OffcanvasNav.vue (mobile sidebar)
       │     ├─ Types: NavItem union (shared from types/app)
       │     └─ Props: navItems, currentPage
       │
       └── useGesture.ts (module-level singleton composable)
             ├─ Left-edge right-swipe → showOffcanvas = true (open)
             └─ Right-edge left-swipe → showOffcanvas = false (close)
```

##### 4.2.1.2 Active Nav-Item

`isActive(href)` compares `props.currentPage` against `normalizeInternalPath(href)`.
Uses `:class="{ active: isActive(item.href) }"` and `:aria-current`.

##### 4.2.1.3 Mobile Brand Scroll Swap

On mobile screens (< 768 px):

- `brandProgress` computed (0->1 over first 64 px of scroll)
- Logo slides up, page name slides in from below

##### 4.2.1.4 Dropdowns

- **Language**: `<BDropdown>` with `<BDropdownItem>`, calls `setLocale()`
- **Theme**: `<BDropdown>` with icon + label, calls `setPreference()`
- **Settings gear**: `<a data-settings-open>` captured by App.vue delegation
- **Articles (v3.11.1)**: `NavItem` is a discriminated union
  (`NavLinkItem` `{ type: "link"; href; i18nKey }` |
  `NavDropdownItem` `{ type: "dropdown"; i18nKey; children: NavLinkItem[] }`)
  shared from `types/app.ts`. Desktop renders a dropdown as `<BDropdown>`
  with `toggle-class="nav-link"` and children as plain `<li>` +
  `TypeAwareLink class="dropdown-item"` (SPA navigation); the toggle is
  `active` when any child is active (`isDropdownActive`). Mobile
  (OffcanvasNav) renders a dropdown as a muted group label
  (`.offcanvas-nav-group-label`) + indented child links
  (`.offcanvas-nav-group`).

##### 4.2.1.5 Edge-Swipe Gestures (Mobile Touch)

On mobile viewports (≤ 768 px) with touch input (`html.user-input-touch`),
the offcanvas can be opened and closed via edge-swipe gestures:

- **Open**: swipe right from the **left** edge → sets `showOffcanvas = true`
- **Close**: swipe left from the **right** edge → sets `showOffcanvas = false`

**Implementation** — `useGesture.ts` (module-level singleton, ref-counted):

- `AppNavbar.vue` calls `useGesture(showOffcanvas)` during setup
- The composable registers global `touchstart` / `touchmove` / `touchend` listeners
  once (on first consumer mount) and removes them on last unmount
- Uses `useBreakpoint()` to check the shared breakpoint ref at gesture time
- An internal `trackingDirection` (`"open"` | `"close"`) determines which
  edge and direction to validate

**Gesture criteria**:

| Parameter        | Value  | Purpose                                             |
| ---------------- | ------ | --------------------------------------------------- |
| Edge zone        | ≤80 px | Touch must start within 80 px of either edge        |
| Minimum distance | ≥80 px | Horizontal displacement required to trigger         |
| Direction ratio  | >1.5×  | `\|Δx\| > \|Δy\| × 1.5` — prevents scroll conflicts |

**Open vs. close logic**:

| State                   | Edge  | Direction | Action           |
| ----------------------- | ----- | --------- | ---------------- |
| `showOffcanvas = false` | Left  | Rightward | → set to `true`  |
| `showOffcanvas = true`  | Right | Leftward  | → set to `false` |

**Conflict avoidance**:

- The correct edge/direction is enforced based on the current model state
  (offcanvas closed → only left-edge open gesture; offcanvas open → only
  right-edge close gesture)
- Vertical scrolling always wins (horizontal must dominate by 1.5×)
- iOS Safari's native back-swipe has higher priority at the OS level
- All `touchstart`/`touchmove` listeners use `{ passive: true }` to avoid
  blocking page scroll

##### 4.2.1.6 CSS

All navbar CSS is in `<style scoped>` (~250 lines). Uses `:deep(.dropdown-toggle.btn)`
to style BDropdown buttons to match `.nav-link` appearance.
