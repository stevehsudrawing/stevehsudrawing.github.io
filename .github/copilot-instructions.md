---
description: >
  Project-level context, conventions, and constraints for Steve Hsu (什五)'s
  Link-Hub (stevehsudrawing.github.io). Covers tech stack (HTML5 / CSS /
  TypeScript / Vite 8 / pnpm), naming conventions, project structure, and
  feature references. Use when: working on any file in this repository.
applyTo: "**"
---

# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for
Copilot when working in this repository.

Details for each topic live in `instructions/` subdirectories - those files are
loaded automatically when relevant (via `applyTo` globs in their YAML
frontmatter). The Quick Reference below distills the most critical conventions
that apply to every session.

---

## 0. Quick Reference (loaded every session)

### 0.1 Naming

| Context                               | Convention                 | Examples                                                |
| ------------------------------------- | -------------------------- | ------------------------------------------------------- |
| HTML IDs, CSS classes, `data-*` attrs | `dash-case`                | `#page-content`, `.loading-screen`, `data-i18n-tooltip` |
| TS variables, functions, DOM refs     | `camelCase`                | `currentLang`, `initAllTooltips`, `htmlElement`         |
| TS top-level constants, `as const`    | `SCREAMING_SNAKE_CASE`     | `INTERNAL_PAGES`, `EXCLUDED_PAGES`                      |
| TS `const enum`                       | `PascalCase`               | `StorageKey`, `AppEvent`                                |
| TS interfaces, type aliases           | `PascalCase`               | `CardData`, `Lang`, `ThemeChoice`                       |
| Bootstrap classes                     | Bootstrap-native           | `.btn-primary`, `.dropdown-menu`                        |
| CSS custom properties (project)       | `--shlh-*`                 | `--shlh-primary`, `--shlh-primary-500-rgb`              |
| CSS custom properties (Bootstrap)     | `--bs-*`                   | `--bs-border-radius`, `--bs-link-hover-color`           |
| CSS custom properties (font)          | `--shlh-font-{cat}-{lang}` | `--shlh-font-sans-serif-en`                             |

### 0.2 TypeScript Code

- **The principle of "high cohesion and low coupling"**: a function should
  perform only one task to ensure it can be reused.

- **No suffix is required when importing `.ts` modules**:
  `import { foo } from '../core/bar'`

- **`import type`** for type-only imports (erased at build time):
  `import type { Lang } from '../types/app.js'`

- **Single Source of Truth**: every piece of data must have exactly one
  defining location; all other modules consume it via imports. Duplicate
  definitions, mirrored constants, and parallel storage formats are forbidden.

- **Direct Import Principle**: import directly from the source module; do not
  re-export through intermediate modules

- **TSDoc required**: every exported variable, function, interface, and type
  alias must have a standard TSDoc comment (`/** ... */`)

### 0.3 Function Naming

| Prefix               | Purpose                       | Prefix                    | Purpose                       |
| -------------------- | ----------------------------- | ------------------------- | ----------------------------- |
| `init*` / `dispose*` | Set up / tear down listeners  | `create*` / `remove*`     | Create / remove DOM elements  |
| `add*`               | Add DOM element or attribute  | `mark*`                   | Set/clear visual state marker |
| `handle*`            | Named DOM event handler       | `load*`                   | Async data fetching           |
| `update*`            | Update existing DOM content   | `apply*`                  | Apply setting / style change  |
| `get*` / `set*`      | Retrieve / set value or state | `populate*` / `generate*` | Fill UI lists / inject DOM    |
| `hide*`              | Hide an element               | `extract*` / `normalize*` | Parse / sanitize input        |

- **Batch functions** must include `All` and delegate to an idempotent single-
  element function: `initAllTooltips()` -> `createTooltip(el)`

- **Symmetric pairs**: every add/create/init must have a matching remove/
  destroy/dispose counterpart

### 0.4 Project Structure

**Layered architecture with semantic constraints:**

```
types/       -> shared type definitions and enums
  ↑
configs/     -> pure runtime config data — no DOM, no events
  ↑
core/        -> pure logic & global state — no DOM, no events
  ↑
platform/    -> browser platform services — imperative DOM APIs that Vue cannot own
  ↑↓
composables/ -> Vue reactive state + side-effects
  ↑
components/  -> Vue SFCs
  ↑
pages/       -> PascalCase filenames, <script setup> + <style scoped>.
  ↑
plugins/     -> Vue plugins — global provide/inject
  ↑
main.ts      -> Entry point: CSS imports + globals + createApp + mount
router.ts    -> Vue Router config (routes, scrollBehavior, error recovery)
App.vue      -> Root shell (nav, router-view, modals, initialization)
```

| Layer          | May import from                                                   | Must NOT import from                                    |
| -------------- | ----------------------------------------------------------------- | ------------------------------------------------------- |
| `types/`       | npm, browser APIs                                                 | `core/*`, `platform/*`, `composables/*`, `components/*` |
| `configs/`     | npm (data-only libraries), `types/*`                              | `core/*`, `platform/*`, `composables/*`, `components/*` |
| `core/`        | `types/*`, `configs/*`                                            | `platform/*`, `composables/*`, `components/*`           |
| `platform/`    | `types/*`, `configs/*`, `core/*`, `composables/` (limited)        | `components/*`                                          |
| `composables/` | `types/*`, `configs/*`, `core/*`, `platform/*` (limited)          | `components/*`                                          |
| `components/`  | `types/*`, `configs/*`, `core/*`, `composables/*`, `platform/*`   | —                                                       |
| `pages/`       | `types/*`, `configs/*`, `core/*`, `composables/*`, `components/*` | `platform/*` (use composables instead)                  |
| `plugins/`     | `types/*`, `configs/*`, `core/*`                                  | `platform/*`, `composables/*`, `components/*`           |

**Decoupling patterns (when import would violate hierarchy):**

- **Composable extraction**: When multiple components share state or side-
  effects, extract to `composables/`.

- **provide/inject**: For sibling-to-sibling communication (e.g. toast
  notifications), use Vue's provide/inject pattern.

- **Vue Router guards**: For cross-cutting navigation concerns, use
  `router.beforeEach` / `router.afterEach` (not imperative DOM listeners).

### 0.5 File Rules

- **`src/{core,platform,composables}/*`**: define only - no top-level function
  calls or self-executing code. All wiring happens in entry points. (Vue
  composables may call `inject()` but must not trigger side effects.)

- **Entry points**: `src/main.ts` + `src/router.ts` + `src/App.vue` (full-
  feature pages: index, about, artworks, blogs, chatting, softwares)

- **Storage access mandate**: every localStorage key has typed getter/setter
  accessors (`getStoredX` / `setStoredX`) in `src/platform/storage.ts`; raw
  `localStorage` usage outside `storage.ts` is forbidden.

- **CSS comments**: `/* ====...==== Component - description */` banners;
  `/* --- Child --- */` sub-sections

- **HTML page tiers**: `full` (`src/main.ts`) / `error` (minimal, no JS
  framework, only `public/legacy/base.css`)

- **Markdown**: numbered headings (`## 1.`, `#### 1.2.3`), cross-references with
  `§X.Y.Z` hyperlink anchors; when inserting chapters of the same level, do not
  use decimal points; continue the numbering sequentially instead.

### 0.6 HAST Conventions

- JSON properties use **camelCase** (`className`, `dataI18n`, `dataImgFeature`);
  automatically converted to kebab-case HTML (`class`, `data-i18n`,
  `data-img-feature`)

- Node types: `root` (has `children`), `element` (has `tagName`, `properties`,
  `children`), `text` (has `value`), `comment` (has `value`)

### 0.7 Vue Component Conventions

**Naming** (see [§2.3.3](./instructions/2-general-naming-conventions/3-typescript.instructions.md#233-vue-specific-rules)):

| Context      | Convention   | Examples                                         |
| ------------ | ------------ | ------------------------------------------------ |
| `.vue` files | `PascalCase` | `AppNavbar.vue`, `SettingsModal.vue`             |
| Composables  | `useXxx.ts`  | `useI18n.ts`, `useTheme.ts`, `useStoredValue.ts` |

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

**Static HTML coexistence**: `onMounted` + `document.getElementById` + non-scoped `<style>` + `defineExpose` (see [§3.4.3](./instructions/3-project-structural-constraints/4-vue-component-conventions.instructions.md#343-static-html-coexistence)).

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
- [**4.1.6 Page Navigation**](./instructions/4-feature-references/01-core-systems/06-page-navigation.instructions.md)
- [**4.1.7 Modal Helpers**](./instructions/4-feature-references/01-core-systems/07-modal-helpers.instructions.md)
- [**4.1.8 Breakpoint Detection**](./instructions/4-feature-references/01-core-systems/08-breakpoint.instructions.md)
- [**4.1.9 GitHub API**](./instructions/4-feature-references/01-core-systems/09-github-api.instructions.md)

### 4.2 UI Components

- [**4.2.1 Navbar**](./instructions/4-feature-references/02-ui-components/01-navbar.instructions.md)
- [**4.2.2 Footer**](./instructions/4-feature-references/02-ui-components/02-footer.instructions.md)
- [**4.2.3 Loading**](./instructions/4-feature-references/02-ui-components/03-loading.instructions.md)
- [**4.2.4 Feature-Aware Image**](./instructions/4-feature-references/02-ui-components/04-feature-aware-img.instructions.md)
- [**4.2.5 Inline SVG**](./instructions/4-feature-references/02-ui-components/05-inline-svg.instructions.md)
- [**4.2.6 Tooltips & Toast**](./instructions/4-feature-references/02-ui-components/06-tooltips-toast.instructions.md)
- [**4.2.7 Copy Protection**](./instructions/4-feature-references/02-ui-components/07-copy-protection.instructions.md)
- [**4.2.8 Hero Section**](./instructions/4-feature-references/02-ui-components/08-hero-section.instructions.md)
- [**4.2.9 Section Headings & Anchors**](./instructions/4-feature-references/02-ui-components/09-section-headings.instructions.md)
- [**4.2.10 Markdown Article**](./instructions/4-feature-references/02-ui-components/10-markdown-article.instructions.md)
- [**4.2.11 Sticker Section**](./instructions/4-feature-references/02-ui-components/11-sticker-section.instructions.md)
- [**4.2.12 Link Cards**](./instructions/4-feature-references/02-ui-components/12-link-cards.instructions.md)
- [**4.2.13 Link Button Groups**](./instructions/4-feature-references/02-ui-components/13-link-button-groups.instructions.md)
- [**4.2.14 HAST → Vue Rendering**](./instructions/4-feature-references/02-ui-components/14-hast-to-vue.instructions.md)

### 4.3 Modals

- [**4.3.1 External Link Confirmation**](./instructions/4-feature-references/03-modals/01-external-link.instructions.md)
- [**4.3.2 QR Code**](./instructions/4-feature-references/03-modals/02-qr-code.instructions.md)

### 4.4 Navigation & Accessibility

- [**4.4.1 Accessibility**](./instructions/4-feature-references/04-navigation-accessibility/01-accessibility.instructions.md)
- [**4.4.2 Page Transitions**](./instructions/4-feature-references/04-navigation-accessibility/02-page-transitions.instructions.md)
- [**4.4.3 Page Chain Navigation**](./instructions/4-feature-references/04-navigation-accessibility/03-page-chain.instructions.md)

### 4.5 Build & Infrastructure

- [**4.5.1 Build-time Injection**](./instructions/4-feature-references/05-build-infrastructure/01-build-injection.instructions.md)
- [**4.5.2 SEO & PWA**](./instructions/4-feature-references/05-build-infrastructure/02-seo-pwa.instructions.md)
- [**4.5.3 Utilities**](./instructions/4-feature-references/05-build-infrastructure/03-utilities.instructions.md)

---

## 5. Copilot Working Conventions

### 5.1 Response Conventions

When generating responses for this project, Copilot should:

0. _**ALWAYS PLACE THE FINAL RESPONSE OUTSIDE THE `thinking` BLOCK**_: The
   `thinking` XML tag is for internal reasoning only — anything inside it is
   invisible to the user and will render as "Sorry, no response was returned."
   All user-facing content (summaries, explanations, code suggestions,
   confirmation messages, etc.) MUST be placed in the `response` section
   (i.e., after the closing `</thinking>` tag). This is the single most
   common failure mode — always double-check before completing a turn.

1. **Think in English**: Internal reasoning and analysis should be in English.

2. **Read the necessary documents**: Instructions are organized in the form of
   folders. Before generating a response, Copilot should first read the
   relevant documents in `.github/instructions` according to the user's
   requirements to understand the specifications of this project.

3. **Respond using the language that the user is using**: For example, if the
   user is conversing in Chinese, responses should be in Chinese.

### 5.2 Writing & Implementation Conventions

0. **Write code / docs / commit messages in English (United States)**: All
   code, comments, documentation, commit messages should be in English
   (United States). When writing, use standard ASCII characters as much as
   possible. This helps to use `beautify` to format files, as it has poor
   support for full-width characters.

1. **Discuss before executing**: When the user proposes a new function or a
   change, first explain the approach and analysis. Only proceed with
   implementation after the user confirms ("go ahead", "执行", "可以", etc.).

2. **Priority of norms/standards**: If there are more normative or standard
   practices, priority should be given to norms or standards, even if
   refactoring is required.

3. **Always pay attention to document updates**: When adding, modifying, or
   deleting new features, it is necessary to add, update or delete the
   corresponding instruction documents, even if temporarily.

4. **Always `typecheck` after modification**: After each modification, the
   following command should be executed to check whether it can be built
   properly:

   ```pwsh
   pnpm typecheck ; pnpm build
   ```

### 5.3 Debugging & Browser Verification

When adding a new feature, restructuring in a large scale or fixing a behavior,
verify in the browser — `pnpm typecheck ; pnpm build` alone cannot catch
runtime issues (scroll behavior, modal state, history).

0. **Start the dev server** with `pnpm dev` (Vite). If port 5173 is busy,
   Vite picks another port — use the printed URL. Open the page in the VS
   Code integrated browser and walk through the affected flows (navigation,
   deep links, back/forward, modal open/close).

1. **Brief Playwright usage**:
   - `open_browser_page` to open a URL; `read_page` (accessibility snapshot)
     to assert rendered state; `click_element` / `type_in_page` to interact.
   - Prefer `page.evaluate` for precise assertions: read `location.href`,
     `window.scrollY`, `document.querySelector('.modal.show')`, etc.
   - Check the dev-server terminal for HMR updates and runtime errors.

2. **Modal-selector gotcha**: `App.vue` renders ALL six modals at once —
   hidden modals' buttons are still in the DOM. Scope selectors to the
   visible one (`.modal.show ...`), otherwise a click may land on a hidden
   modal's button (e.g. a second "Close" that pops the top modal).

3. **Playwright "Element is not visible"**: `page.click` often refuses modal
   footer buttons. Use
   `locator('.modal.show .modal-footer button').dispatchEvent('click')` to
   fire a real click event that triggers Vue's handlers.

4. **Window API patches**: patches installed via `page.evaluate` (e.g.
   wrapping `history.go`) are wiped by full-page navigations. Use
   `page.addInitScript` to install them before the app loads.

5. **`history.state` is NOT reactive**: a computed that reads
   `history.state` must also depend on a reactive source (e.g. the modal's
   `visible`) so it re-evaluates when it matters (e.g. after navigation).

6. **vue-router 5.2 scroll restore**: the saved position comes from
   `history.state.scroll`; a plain `return savedPosition` in
   `scrollBehavior` gets clamped to 0 while async content (link cards,
   GitHub cards) mounts. Poll (rAF) until the page is tall enough before
   resolving.

---

> The following content was automatically added by the VS Code Mermaid
> extension.

<!-- mermaid-ai-skills:start -->

## Mermaid Diagrams

When the user asks to create, edit, or visualize a diagram, follow the
instructions in `.github/instructions/mermaid.instructions.md`.

<!-- mermaid-ai-skills:end -->
