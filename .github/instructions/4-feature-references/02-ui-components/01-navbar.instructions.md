---
description: >
  Navbar: AppNavbar.vue (fixed-top nav with brand, links, BDropdown for language/theme),
  OffcanvasNav.vue (mobile sidebar), navbar.ts bridge (window.__navbar).  Covers active
  nav-item highlighting, mobile brand scroll swap, scroll border, and dropdown menus.
  Use when: modifying navigation, navbar layout, or dropdown behavior.
applyTo: >
  src/components/layout/AppNavbar.vue;
  src/components/layout/OffcanvasNav.vue;
  src/ui/navbar.ts
---

#### 4.2.1 Navbar

##### 4.2.1.1 Architecture

```
AppNavbar.vue (one-shot Vue render)
  ├─ Props: currentPage: string
  ├─ State: navItems, composables, scroll state, theme options, dropdown labels
  ├─ Actions: switchLanguage(), scroll/resize handlers
  └─ Expose: setActiveNavItem(), updateNavbarBrandText() (no-ops for bridge compat)
       │
       ├── OffcanvasNav.vue (mobile sidebar)
       │     ├─ Types: NavItem interface
       │     └─ Props: navItems, currentPage
       │
       └── navbar.ts (bridge -> window.__navbar)
```

##### 4.2.1.2 Active Nav-Item

`isActive(href)` compares `props.currentPage` against `normalizeInternalPath(href)`.
Uses `:class="{ active: isActive(item.href) }"` and `:aria-current`.

##### 4.2.1.3 Mobile Brand Scroll Swap

On mobile screens (< 992 px):

- `brandProgress` computed (0->1 over first 64 px of scroll)
- Logo slides up, page name slides in from below

##### 4.2.1.4 Dropdowns

- **Language**: `<BDropdown>` with `<BDropdownItem>`, calls `setLocale()`
- **Theme**: `<BDropdown>` with icon + label, calls `setPreference()`
- **Settings gear**: `<a data-settings-open>` captured by App.vue delegation

##### 4.2.1.5 CSS

All navbar CSS is in `<style scoped>` (~250 lines). Uses `:deep(.dropdown-toggle.btn)`
to style BDropdown buttons to match `.nav-link` appearance.
