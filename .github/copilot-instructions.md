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
- **Entry points**: `src/main.ts` (full-feature pages: index, about, artworks, blogs, chatting, softwares), `src/main-lightweight.ts` (404 page)
- **CSS comments**: `/* ====...==== Component - description */` banners; `/* --- Child --- */` sub-sections
- **HTML page tiers**: `full` (`src/main.ts`) / `lightweight` (`src/main-lightweight.ts`, 404) / `error` (minimal, no JS framework, only `public/legacy/base.css`)
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
  - 3.2.2 `src/main.ts` & `src/main-lightweight.ts`: Entry Points, Wire Everything
  - 3.2.3 `src/stylesheets/` & `public/legacy/*.css`: Commenting Convention
  - 3.2.4 `*.html`: Page Tiers
  - 3.2.5 `*.md`: Document Writing Standards
- [**3.3 Type Definitions**](./instructions/3-project-structural-constraints/3-type-definitions.instructions.md)
  - 3.3.1 Browser Types (`src/types/`)
  - 3.3.2 Build-time Types (`build/types.ts`)
  - 3.3.3 Link-card JSON Format (`build/configs/link-cards/*.json`)
  - 3.3.4 Link-button-group JSON Format (`build/configs/link-button-groups/*.json`)

## 4. Feature Reference

- [**4.1 Browser Detection & Compatibility Fallbacks**](./instructions/4-feature-references/1-browser-detection-and-compatibility-fallbacks.instructions.md)
- [**4.2 Build-time Injection**](./instructions/4-feature-references/2-build-time-injection.instructions.md)
  - 4.2.1 Head Tag Injection
  - 4.2.2 Page Component Injection
  - 4.2.3 Link Card Injection
  - 4.2.4 Asset Minification
  - 4.2.5 Link Button Group Injection
- [**4.3 Internationalization (i18n)**](./instructions/4-feature-references/3-internationalization-i18n.instructions.md)
  - 4.3.1 i18n Key Naming Conventions
- [**4.4 Theme System**](./instructions/4-feature-references/4-theme-system.instructions.md)
  - 4.4.1 Color Variable Naming
- [**4.5 Link Cards**](./instructions/4-feature-references/5-link-cards.instructions.md)
- [**4.6 Page Transitions**](./instructions/4-feature-references/6-page-transitions.instructions.md)
- [**4.7 Loading Screen**](./instructions/4-feature-references/7-loading-screen.instructions.md)
- [**4.8 Settings & Preferences**](./instructions/4-feature-references/8-settings-preferences.instructions.md)
- [**4.9 Navigation & Accessibility**](./instructions/4-feature-references/9-navigation-accessibility.instructions.md)
- [**4.10 QR Code & Export**](./instructions/4-feature-references/10-qr-code-export.instructions.md)
- [**4.11 Fonts & Typography**](./instructions/4-feature-references/11-fonts-typography.instructions.md)
  - 4.11.1 Font Variable Naming
  - 4.11.2 Font Stack Design
- [**4.12 Tooltips**](./instructions/4-feature-references/12-tooltips.instructions.md)
- [**4.13 Image Utilities**](./instructions/4-feature-references/13-image-utilities.instructions.md)
  - 4.13.1 `data-img-feature` Attribute
    - 4.13.1.1 `follow-theme`
    - 4.13.1.2 `colored`
  - 4.13.2 Loading Opacity
- [**4.14 SVG Injection**](./instructions/4-feature-references/14-svg-injection.instructions.md)
- [**4.15 Utilities**](./instructions/4-feature-references/15-utilities.instructions.md)
- [**4.16 SEO**](./instructions/4-feature-references/16-seo.instructions.md)
  - 4.16.1 SEO Elements by Page Tier
  - 4.16.2 Structured Data (JSON-LD)
    - 4.16.2.1 Homepage (`index.html`)
    - 4.16.2.2 Sub-Pages
  - 4.16.3 Sitemap
  - 4.16.4 Hreflang
  - 4.16.5 Noscript SEO Fallback
  - 4.16.6 Heading Hierarchy
  - 4.16.7 Homepage H1 Rich Text
  - 4.16.8 Crawler Whitelist
- [**4.17 External Link Confirmation**](./instructions/4-feature-references/17-external-link-confirmation.instructions.md)
  - 4.17.1 `data-link-img-props` Attribute
- [**4.18 PWA Splash Screens**](./instructions/4-feature-references/18-pwa-splash-screens.instructions.md)
- [**4.19 Link Button Groups**](./instructions/4-feature-references/19-link-button-groups.instructions.md)
- [**4.20 Modal Focus Management**](./instructions/4-feature-references/20-modal-focus-management.instructions.md)
  - 4.20.1 `.default-keyboard-focus` CSS Class
  - 4.20.2 Current Default-Focus Assignments
  - 4.20.3 Key Function
  - 4.20.4 Interaction with Other Systems

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Read the necessary documents**: Instructions are organized in the form of folders. Before generating a response, Copilot should first read the relevant documents in `.github/instructions` according to the user's requirements to understand the specifications of this project.
3. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
4. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `->`.
5. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
6. **Priority of norms/standards**: If there are more normative or standard practices, priority should be given to norms or standards, even if refactoring is required.
