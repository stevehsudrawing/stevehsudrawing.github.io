---
description: >
  Vue SFC conventions: CSS style block taxonomy (scoped / non-scoped / :deep() / global),
  CSS ownership comments in base.css, static HTML coexistence pattern,
  <script setup> section conventions (Types -> Props -> State -> Actions -> Expose).
  Use when: creating or modifying any .vue file or .css file.
applyTo: >
  src/components/**/*.vue;
  src/stylesheets/global/base.css
---

### 3.4 Vue Component Conventions

#### 3.4.1 CSS Style Block Taxonomy

| Style block               | Use case                                                                                                 | Example                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `<style scoped>`          | Styles owned entirely by one `.vue` component                                                            | Modal layout, QR share card, toast animations |
| `<style>` (non-scoped)    | Component owns the CSS but the target element is static HTML outside Vue's render tree                   | `#loading-bar`, `.scroll-hint`                |
| `:deep(.selector)`        | Target elements inside a child component (e.g. BModal's `.modal-body`)                                   | `:deep(.modal-body) { display: flex; }`       |
| `src/stylesheets/global/` | Truly global styles: CSS reset, typography, Bootstrap variable overrides, build-time injected components | `base.css`, `theme.css`, `fonts.css`          |

#### 3.4.2 CSS Ownership Comments in `base.css`

When a global CSS selector belongs to a known Vue component, annotate with
a `TODO:` comment:

```css
/* TODO: §4.2.4 -> FeatureAwareImg.vue */
.img-fit { ... }

/* TODO: §4.2.1 -> AppNavbar.vue */
.nav-link { ... }
```

When a selector is explicitly NOT owned by any Vue component, document the reason:

```css
/* ========================================================================
   Button Groups
   (Build-time injected — not owned by any Vue component.)
   ======================================================================== */
```

#### 3.4.3 Static HTML Coexistence

Some Vue components control static HTML elements that exist in each `.html`
page or are rendered in `App.vue`'s template. These components:

- Use `onMounted` to locate the static element via `document.getElementById`
- Own the CSS via **non-scoped** `<style>` blocks
- Expose imperative methods via `defineExpose`

**Components following this pattern**:

- `LoadingScreen.vue` — controls `#loading-screen` (static HTML in each page)
- `LoadingBar.vue` — controls `#loading-bar` (rendered in own template)

#### 3.4.4 `<script setup lang="ts">` Section Conventions

Every `<script setup>` block **MUST** follow the five sections below, in
this exact order. Any section not used by the component is omitted — but
no other sections may be introduced.

```ts
// =========================================================================
// Types
// =========================================================================
//   Local interface / type definitions (only when non-trivial).

// =========================================================================
// Props
// =========================================================================
//   defineProps + defineEmits — the component's public interface.
//   Always the first section (after top-level imports).

// =========================================================================
// State
// =========================================================================
//   ref / reactive / computed / composable calls / defineModel —
//   the reactive data layer.
//   Co-location via domain sub-sections (----) is permitted.

// =========================================================================
// Actions
// =========================================================================
//   Functions / event handlers / methods — the behaviour layer.
//   Template-called functions (@click="confirm") belong here, not State.

// =========================================================================
// Expose
// =========================================================================
//   defineExpose — the imperative public API surface.
//   Omitted if the component is purely template-driven.
```

**Banner format**:

| Level   | Syntax                        | Used for                                   |
| ------- | ----------------------------- | ------------------------------------------ |
| Section | `// ====...==== Section Name` | Top-level section                          |
| Sub     | `// ----...---- Sub Name`     | Domain co-location within State or Actions |

**Co-location example**:

```ts
// =========================================================================
// State
// =========================================================================

// -------------------------------------------------------------------------
// Theme-aware src
// -------------------------------------------------------------------------
const { effectiveTheme } = useTheme();
const currentSrc = computed(() => {
  /* ... */
});

// -------------------------------------------------------------------------
// Loading opacity
// -------------------------------------------------------------------------
const loaded = ref(false);
```

However, functions called from the template (e.g. `@click="confirm"`) or
used by multiple sub-sections belong in `Actions`.

**Design rationale**:

- **Fixed vocabulary, fixed order** — predictable navigation in every `.vue` file
- **All sections optional** — a simple 30-line component may have only `Props` and `State`
- **Co-location via sub-sections** — respects Vue Composition API's strength
  of keeping related concerns together
