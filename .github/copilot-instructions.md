---
description: >
  Project-level context, conventions, and constraints for Steve Hsu's Link-Hub
  (stevehsudrawing.github.io). Covers tech stack (HTML5/CSS/TypeScript/Vite 8/pnpm),
  naming conventions, project structure, and feature references.
  Use when: working on any file in this repository.
---

# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

Details for each topic live in `instructions/` subdirectories - those files are loaded automatically when relevant (via `applyTo` globs in their YAML frontmatter). The Quick Reference below distills the most critical conventions that apply to every session.

---

## 0. Quick Reference (loaded every session)

### 0.1 Naming

| Context                               | Convention                            | Examples                                                |
| ------------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| HTML IDs, CSS classes, `data-*` attrs | `dash-case`                           | `#page-content`, `.loading-screen`, `data-i18n-tooltip` |
| TS variables, functions, DOM refs     | `camelCase`                           | `currentLang`, `initAllTooltips`, `htmlElement`         |
| TS top-level constants, `as const`    | `SCREAMING_SNAKE_CASE`                | `INTERNAL_PAGES`, `EXCLUDED_PAGES`                      |
| TS `const enum`                       | `PascalCase`                          | `StorageKey`, `AppEvent`                                |
| TS interfaces, type aliases           | `PascalCase`                          | `CardData`, `Lang`, `ThemeChoice`                       |
| Bootstrap classes                     | Bootstrap-native                      | `.btn-primary`, `.dropdown-menu`                        |
| CSS custom properties (project)       | `--shlh-*`                            | `--shlh-primary`, `--shlh-primary-500-rgb`              |
| CSS custom properties (Bootstrap)     | `--bs-*`                              | `--bs-border-radius`, `--bs-link-hover-color`           |
| CSS custom properties (font)          | `--shlh-font-{cat}-{priority}-{lang}` | `--shlh-font-sans-serif-text-major-en`                  |

### 0.2 TypeScript Code

- **The principle of "high cohesion and low coupling"**: a function should perform only one task to ensure it can be reused.
- **No suffix is required when importing `.ts` modules**: `import { foo } from '../core/bar'`
- **`import type`** for type-only imports (erased at build time): `import type { Lang } from '../types/app.js'`
- **Direct Import Principle**: import directly from the source module; do not re-export through intermediate modules
- **TSDoc required**: every exported variable, function, interface, and type alias must have a standard TSDoc comment (`/** ... */`)

### 0.3 Function Naming

| Prefix               | Purpose                       | Prefix                    | Purpose                       |
| -------------------- | ----------------------------- | ------------------------- | ----------------------------- |
| `init*` / `dispose*` | Set up / tear down listeners  | `create*` / `remove*`     | Create / remove DOM elements  |
| `add*`               | Add DOM element or attribute  | `mark*`                   | Set/clear visual state marker |
| `handle*`            | Named DOM event handler       | `load*`                   | Async data fetching           |
| `update*`            | Update existing DOM content   | `apply*`                  | Apply setting / style change  |
| `get*` / `set*`      | Retrieve / set value or state | `populate*` / `generate*` | Fill UI lists / inject DOM    |
| `hide*`              | Hide an element               | `extract*` / `normalize*` | Parse / sanitize input        |

- **Batch functions** must include `All` and delegate to an idempotent single-element function: `initAllTooltips()` -> `createTooltip(el)`
- **Symmetric pairs**: every add/create/init must have a matching remove/destroy/dispose counterpart

### 0.4 Project Structure

**Layered architecture with semantic constraints:**

```
types/       -> shared type definitions and enums (app.ts, hast.ts, globals.d.ts, css.d.ts,
  ￪            vue-shims.d.ts, vue-augment.d.ts, bootstrap.d.ts)
  |
core/        -> pure logic & global state — no DOM, no events (i18n.ts, utils.ts)
  ￪
composables/ -> Vue reactive state + side-effects (useI18n.ts, useTheme.ts, useLocalStorage.ts, etc.)
  ￪
platform/    -> browser platform services — imperative DOM APIs that Vue cannot own
  ￪            (theme.ts, accessibility.ts, page-title.ts, bootstrap-css-detection.ts)
  |            Only used for browser APIs with no Vue equivalent (matchMedia, favicon).
  |
components/  -> Vue SFCs (layout/, ui/, modals/, cards/, buttons/)
  ￪
pages/       -> PascalCase filenames, <script setup> + <style scoped>.
  ￪
plugins/     -> Vue plugins — global provide/inject (i18n.ts)
  ￪
main.ts      -> Entry point: CSS imports + globals + createApp + mount
router.ts    -> Vue Router config (routes, scrollBehavior, error recovery)
App.vue      -> Root shell (nav, router-view, modals, initialization)
```

| Layer          | Semantics                                                                   | May import from                                      | Must NOT import from                              |
| -------------- | --------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| `types/`       | Shared type definitions                                                     | npm, browser APIs                                    | `core/*`, `ui/*`, `composables/*`, `components/*` |
| `core/`        | Pure functions, data transforms, global state. **No DOM, no events.**       | `types/*`                                            | `ui/*`, `composables/*`, `components/*`           |
| `composables/` | Vue reactive state + side-effects. May call `inject()`.                     | `types/*`, `core/*`, `platform/*` (limited)          | `components/*`                                    |
| `platform/`    | Browser platform services — imperative DOM APIs.                            | `types/*`, `core/*`                                  | `composables/*`, `components/*`                   |
| `components/`  | Vue SFCs. Own template + styles. May use composables, core utils, platform. | `types/*`, `core/*`, `composables/*`, `platform/*`   | —                                                 |
| `pages/`       | Page-level components. One per route. Renders cards, buttons, hero content. | `types/*`, `core/*`, `composables/*`, `components/*` | `platform/*` (use composables instead)            |
| `plugins/`     | Vue plugins — global provide/inject registrations.                          | `types/*`, `core/*`                                  | `ui/*`, `composables/*`, `components/*`           |

**Decoupling patterns (when import would violate hierarchy):**

- **Composable extraction**: When multiple components share state or side-effects, extract to `composables/`.
- **provide/inject**: For sibling-to-sibling communication (e.g. toast notifications), use Vue's provide/inject pattern.
- **Vue Router guards**: For cross-cutting navigation concerns, use `router.beforeEach` / `router.afterEach` (not imperative DOM listeners).

### 0.5 File Rules

- **`src/{core,ui,composables}/*`**: define only - no top-level function calls or self-executing code. All wiring happens in entry points. (Vue composables may call `inject()` but must not trigger side effects.)
- **Entry points**: `src/main.ts` + `src/router.ts` + `src/App.vue` (full-feature pages: index, about, artworks, blogs, chatting, softwares)
- **CSS comments**: `/* ====...==== Component - description */` banners; `/* --- Child --- */` sub-sections
- **HTML page tiers**: `full` (`src/main.ts`) / `error` (minimal, no JS framework, only `public/legacy/base.css`)
- **Markdown**: numbered headings (`## 1.`, `### 1.2.3`), cross-references with `§X.Y.Z` hyperlink anchors

### 0.6 HAST Conventions

- JSON properties use **camelCase** (`className`, `dataI18n`, `dataImgFeature`); automatically converted to kebab-case HTML (`class`, `data-i18n`, `data-img-feature`)
- Node types: `root` (has `children`), `element` (has `tagName`, `properties`, `children`), `text` (has `value`), `comment` (has `value`)

### 0.7 Vue Component Conventions

**Naming** (see [§2.3.3](./instructions/2-general-naming-conventions/3-typescript.instructions.md#233-vue-specific-rules)):

| Context      | Convention   | Examples                                          |
| ------------ | ------------ | ------------------------------------------------- |
| `.vue` files | `PascalCase` | `AppNavbar.vue`, `SettingsModal.vue`              |
| Composables  | `useXxx.ts`  | `useI18n.ts`, `useTheme.ts`, `useLocalStorage.ts` |

**`<script setup>` section order** (see [§3.4.5](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md#345-script-setup-langts-section-conventions)):

```
Types -> Props -> State -> Actions -> Expose
```

Sections use `// ====...==== Name` banners; sub-sections use `// ----...---- Name`.

**CSS style blocks** (see [§3.4.1](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md#341-css-style-block-taxonomy)):

| Block                  | When                                          |
| ---------------------- | --------------------------------------------- |
| `<style scoped>`       | Owned by one component                        |
| `<style>` (non-scoped) | Targets static HTML outside Vue's render tree |
| `:deep(.sel)`          | Penetrate child component boundary            |
| `global/*.css`         | Truly global styles                           |

**Bridge pattern**: Legacy TS consumers use `window.__xxx` -> bridge module -> Vue component via `defineExpose` (see [§3.4.3](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md#343-legacy-bridge-pattern-window__xxx)).

**Static HTML coexistence**: `onMounted` + `document.getElementById` + non-scoped `<style>` + `defineExpose` (see [§3.4.4](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md#344-static-html-coexistence)).

---

## Table of Contents

The remainder of this document links to detailed reference files in `instructions/`.

## 1. Tech Stack

- [**1.1 Base**](./instructions/1-tech-stack/1-base.instructions.md)
- [**1.2 External Dependencies**](./instructions/1-tech-stack/2-external-dependencies.instructions.md)
- [**1.3 Browser Baseline**](./instructions/1-tech-stack/3-browser-baseline.instructions.md)
- [**1.4 Deployment**](./instructions/1-tech-stack/4-deployment.instructions.md)
- [**1.5 Git Hooks**](./instructions/1-tech-stack/5-git-hooks.instructions.md)

## 2. General Naming Conventions

- [**2.1 HTML / CSS**](./instructions/2-general-naming-conventions/1-html-css.instructions.md)
- [**2.2 CSS Custom Properties**](./instructions/2-general-naming-conventions/2-css-custom-properties.instructions.md)
- [**2.3 TypeScript**](./instructions/2-general-naming-conventions/3-typescript.instructions.md)

## 3. Project Structural Constraints

- [**3.1 Folder Overview**](./instructions/3-project-structural-constraints/1-folder-overview.instructions.md)
- [**3.2 General File Rules**](./instructions/3-project-structural-constraints/2-general-file-rules.instructions.md)
- [**3.3 Type Definitions**](./instructions/3-project-structural-constraints/3-type-definitions.instructions.md)
- [**3.4 Vue Component Conventions**](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md)

## 4. Feature Reference

> Files in `4-feature-references/` are organized into five functional
> subdirectories. Within each directory, files use a `NN-topic.instructions.md`
> naming scheme -- the two-digit prefix defines the reading order. To add a
> new file, pick the next available number in the appropriate directory, or
> create a new directory if no existing group fits.
>
> **Directories**: 01-core-systems · 02-ui-components · 03-modals ·
> 04-navigation-accessibility · 05-build-infrastructure

### 4.1 Core Systems

- [**4.1.1 I18n**](./instructions/4-feature-references/01-core-systems/01-i18n.instructions.md)
- [**4.1.2 Theme**](./instructions/4-feature-references/01-core-systems/02-theme.instructions.md)
- [**4.1.3 Settings**](./instructions/4-feature-references/01-core-systems/03-settings.instructions.md)
- [**4.1.4 Fonts**](./instructions/4-feature-references/01-core-systems/04-fonts.instructions.md)
- [**4.1.5 Browser Detection**](./instructions/4-feature-references/01-core-systems/05-browser-detection.instructions.md)
- [**4.1.6 Page Navigation**](./instructions/4-feature-references/01-core-systems/06-page-navigation.instructions.md)
- [**4.1.7 Modal Helpers**](./instructions/4-feature-references/01-core-systems/07-modal-helpers.instructions.md)

### 4.2 UI Components

- [**4.2.1 Navbar**](./instructions/4-feature-references/02-ui-components/01-navbar.instructions.md)
- [**4.2.2 Footer**](./instructions/4-feature-references/02-ui-components/02-footer.instructions.md)
- [**4.2.3 Loading**](./instructions/4-feature-references/02-ui-components/03-loading.instructions.md)
- [**4.2.4 Feature-Aware Image**](./instructions/4-feature-references/02-ui-components/04-feature-aware-img.instructions.md)
- [**4.2.5 Inline SVG**](./instructions/4-feature-references/02-ui-components/05-inline-svg.instructions.md)
- [**4.2.6 Scroll Hint**](./instructions/4-feature-references/02-ui-components/06-scroll-hint.instructions.md)
- [**4.2.7 Tooltips & Toast**](./instructions/4-feature-references/02-ui-components/07-tooltips-toast.instructions.md)
- [**4.2.8 Copy Protection**](./instructions/4-feature-references/02-ui-components/08-copy-protection.instructions.md)
- [**4.2.9 Hero Section**](./instructions/4-feature-references/02-ui-components/09-hero-section.instructions.md)
- [**4.2.10 Section Headings & Anchors**](./instructions/4-feature-references/02-ui-components/10-section-headings.instructions.md)
- [**4.2.11 Markdown Article**](./instructions/4-feature-references/02-ui-components/11-markdown-article.instructions.md)
- [**4.2.12 Sticker Section**](./instructions/4-feature-references/02-ui-components/12-sticker-section.instructions.md)

### 4.3 Modals

- [**4.3.1 External Link Confirmation**](./instructions/4-feature-references/03-modals/01-external-link.instructions.md)
- [**4.3.2 QR Code**](./instructions/4-feature-references/03-modals/02-qr-code.instructions.md)

### 4.4 Navigation & Accessibility

- [**4.4.1 Accessibility**](./instructions/4-feature-references/04-navigation-accessibility/01-accessibility.instructions.md)
- [**4.4.2 Page Transitions**](./instructions/4-feature-references/04-navigation-accessibility/02-page-transitions.instructions.md)

### 4.5 Build & Infrastructure

- [**4.5.1 Build-time Injection**](./instructions/4-feature-references/05-build-infrastructure/01-build-injection.instructions.md)
- [**4.5.2 SEO & PWA**](./instructions/4-feature-references/05-build-infrastructure/02-seo-pwa.instructions.md)
- [**4.5.3 Utilities**](./instructions/4-feature-references/05-build-infrastructure/03-utilities.instructions.md)

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Read the necessary documents**: Instructions are organized in the form of folders. Before generating a response, Copilot should first read the relevant documents in `.github/instructions` according to the user's requirements to understand the specifications of this project.
3. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
4. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `->`.
5. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
6. **Priority of norms/standards**: If there are more normative or standard practices, priority should be given to norms or standards, even if refactoring is required.

<!-- mermaid-ai-skills:start -->

## Mermaid Diagrams

When the user asks to create, edit, or visualize a diagram, follow the
instructions in `.github/instructions/mermaid.instructions.md`.

<!-- mermaid-ai-skills:end -->
