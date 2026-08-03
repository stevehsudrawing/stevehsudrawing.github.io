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

- **Always `.js` extension**, never `.ts`: `import { foo } from '../core/bar.js'`
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
types/    -> shared types and enums (app.ts, hast.ts, globals.d.ts, css.d.ts)
  ↑
core/     -> foundation utilities and global state (i18n.ts, utils.ts)
            NO DOM manipulation, NO event listeners - pure logic only.
  ↑
ui/       -> reusable UI components and behaviors (theme, navbar, accessibility, toast, etc.)
            DOM manipulation, event binding, Bootstrap wrappers.
  ↑
features/ -> cross-cutting feature orchestration (page-transition, lang-switcher, qr-code, etc.)
            Coordinates multiple core + ui modules into user-facing features.
```

| Layer       | Semantics                                                                                                                                                                                                                                | May import from                           | Must NOT import from           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| `types/`    | Shared type definitions                                                                                                                                                                                                                  | npm, browser APIs                         | `core/*`, `ui/*`, `features/*` |
| `core/`     | Foundation logic & state - pure functions, data transforms, global state. **No UI-component-specific DOM ops, no events.** Infrastructure-level DOM (e.g. `[data-i18n]` text replacement, `document.documentElement.lang`) is permitted. | `types/*`                                 | `ui/*`, `features/*`           |
| `ui/`       | Reusable UI components - DOM manipulation, event listeners, Bootstrap wrappers. One concern per module.                                                                                                                                  | `types/*`, `core/*`                       | `features/*`                   |
| `features/` | Feature orchestration - coordinates core + ui modules into user-facing workflows.                                                                                                                                                        | `types/*`, `core/*`, `ui/*`, `features/*` | -                              |

**Decoupling patterns (when import would violate hierarchy):**

- **Event-driven**: `ui/` cannot import `features/`. Use `CustomEvent` via `AppEvent` enum - the ui module dispatches, the feature module listens. (See `LangSwitchRequested` in `settings.ts` -> `lang-switcher.ts`.)
- **Extract shared module**: When multiple features need the same UI behavior, extract it to `ui/`. (See `loading-bar.ts` shared by `page-transition` and `lang-switcher`.)

### 0.5 File Rules

- **`src/{core,ui,features}/*`**: define only - no top-level function calls or self-executing code. All wiring happens in entry points.
- **Entry points**: `src/main.ts` (full-feature pages: index, about, artworks, blogs, chatting, softwares)
- **CSS comments**: `/* ====...==== Component - description */` banners; `/* --- Child --- */` sub-sections
- **HTML page tiers**: `full` (`src/main.ts`) / `error` (minimal, no JS framework, only `public/legacy/base.css`)
- **Markdown**: numbered headings (`## 1.`, `### 1.2.3`), cross-references with `§X.Y.Z` hyperlink anchors

### 0.6 HAST Conventions

- JSON properties use **camelCase** (`className`, `dataI18n`, `dataImgFeature`); automatically converted to kebab-case HTML (`class`, `data-i18n`, `data-img-feature`)
- Node types: `root` (has `children`), `element` (has `tagName`, `properties`, `children`), `text` (has `value`), `comment` (has `value`)

---

## Table of Contents

The remainder of this document links to detailed reference files in `instructions/`.

## 1. Tech Stack

- [**1.1 Base**](./instructions/1-tech-stack/1-base.instructions.md)
- [**1.2 External Dependencies**](./instructions/1-tech-stack/2-external-dependencies.instructions.md)
  - 1.2.1 Dependency Principle
- [**1.3 Browser Baseline**](./instructions/1-tech-stack/3-browser-baseline.instructions.md)
  - 1.3.1 Per-Dependency Minimum Browser Versions
  - 1.3.2 Browser Feature Requirements
- [**1.4 Deployment**](./instructions/1-tech-stack/4-deployment.instructions.md)
- [**1.5 Git Hooks**](./instructions/1-tech-stack/5-git-hooks.instructions.md)
  - 1.5.1 Toolchain
  - 1.5.2 Pre-commit Hook
  - 1.5.3 Configuration
  - 1.5.4 Developer Workflow

## 2. General Naming Conventions

- [**2.1 HTML / CSS**](./instructions/2-general-naming-conventions/1-html-css.instructions.md)
- [**2.2 CSS Custom Properties**](./instructions/2-general-naming-conventions/2-css-custom-properties.instructions.md)
  - 2.2.1 Project-specific
  - 2.2.2 Bootstrap overrides
- [**2.3 TypeScript**](./instructions/2-general-naming-conventions/3-typescript.instructions.md)
  - 2.3.1 Import Conventions
  - 2.3.2 Function Naming by Category
  - 2.3.3 Batch Functions Must Delegate to Single-Element Functions
  - 2.3.4 Single-Element Functions Must Have Symmetric Counterparts
  - 2.3.5 TSDoc Requirement

## 3. Project Structural Constraints

- [**3.1 Folder Overview**](./instructions/3-project-structural-constraints/1-folder-overview.instructions.md)
- [**3.2 General File Rules**](./instructions/3-project-structural-constraints/2-general-file-rules.instructions.md)
  - 3.2.1 `src/{core,ui,features}/*`: Define Only, Never Execute
  - 3.2.2 `src/main.ts`: Entry Points, Wire Everything
  - 3.2.3 `src/stylesheets/` & `public/legacy/*.css`: Commenting Convention
  - 3.2.4 `*.html`: Page Tiers
  - 3.2.5 `*.md`: Document Writing Standards
- [**3.3 Type Definitions**](./instructions/3-project-structural-constraints/3-type-definitions.instructions.md)
  - 3.3.1 Browser Types (`src/types/`)
  - 3.3.2 Build-time Types (`build/types.ts`)
  - 3.3.3 Link-card JSON Format (`build/configs/link-cards/*.json`)
  - 3.3.4 Link-button-group JSON Format (`build/configs/link-button-groups/*.json`)
- [**3.4 Vue Component Conventions**](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md)
  - CSS Style Block Taxonomy
  - CSS Ownership Comments
  - Legacy Bridge Pattern
  - Static HTML Coexistence
  - `<script setup>` Section Conventions

## 4. Feature Reference

> Files in `4-feature-references/` are organized into five functional
> subdirectories. Within each directory, files use a `NN-topic.instructions.md`
> naming scheme — the two-digit prefix defines the reading order. To add a
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

### 4.2 UI Components

- [**4.2.1 Navbar**](./instructions/4-feature-references/02-ui-components/01-navbar.instructions.md)
- [**4.2.2 Footer**](./instructions/4-feature-references/02-ui-components/02-footer.instructions.md)
- [**4.2.3 Loading**](./instructions/4-feature-references/02-ui-components/03-loading.instructions.md)
- [**4.2.4 Feature-Aware Image**](./instructions/4-feature-references/02-ui-components/04-feature-aware-img.instructions.md)
- [**4.2.5 Inline SVG**](./instructions/4-feature-references/02-ui-components/05-inline-svg.instructions.md)
- [**4.2.6 Scroll Hint**](./instructions/4-feature-references/02-ui-components/06-scroll-hint.instructions.md)
- [**4.2.7 Tooltips & Toast**](./instructions/4-feature-references/02-ui-components/07-tooltips-toast.instructions.md)
- [**4.2.8 Copy Protection**](./instructions/4-feature-references/02-ui-components/08-copy-protection.instructions.md)

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

### 4.VC Vue Component Conventions

- [**4.VC Vue Component Conventions**](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md)
  - CSS Style Block Taxonomy
  - CSS Ownership Comments
  - Legacy Bridge Pattern (`window.__xxx`)
  - Static HTML Coexistence
  - `<script setup>` Section Conventions

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
