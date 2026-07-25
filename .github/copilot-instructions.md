# Project Instructions for GitHub Copilot

This document provides project-level context, conventions, and constraints for Copilot when working in this repository.

This is a table of contents; please read as needed. Sections marked as **"MUST READ FIRST"** must be read at the beginning of each session.

---

## 1. Tech Stack

- [**1.1 Base**](./instructions/1-tech-stack/1-base.md)
- [**1.2 External Dependencies**](./instructions/1-tech-stack/2-external-dependencies.md)
    - 1.2.1 Dependency Principle
- [**1.3 Browser Baseline**](./instructions/1-tech-stack/3-browser-baseline.md)
    - 1.3.1 Per-Dependency Minimum Browser Versions
    - 1.3.2 Browser Feature Requirements
- [**1.4 Deployment**](./instructions/1-tech-stack/4-deployment.md)

## 2. General Naming Conventions

- [**2.1 HTML / CSS**](./instructions/2-general-naming-conventions/1-html-css.md) **(MUST READ FIRST)**
- [**2.2 CSS Custom Properties**](./instructions/2-general-naming-conventions/2-css-custom-properties.md) **(MUST READ FIRST)**
    - 2.2.1 Project-specific
    - 2.2.2 Bootstrap overrides
- [**2.3 TypeScript**](./instructions/2-general-naming-conventions/3-typescript.md) **(MUST READ FIRST)**
    - 2.3.1 Import Conventions
    - 2.3.2 Function Naming by Category
    - 2.3.3 Batch Functions Must Delegate to Single-Element Functions
    - 2.3.4 Single-Element Functions Must Have Symmetric Counterparts

## 3. Project Structural Constraints

- [**3.1 Folder Overview**](./instructions/3-project-structural-constraints/1-folder-overview.md) **(MUST READ FIRST)**
- [**3.2 General File Rules**](./instructions/3-project-structural-constraints/2-general-file-rules.md) **(MUST READ FIRST)**
    - 3.2.1 `src/{core,ui,features}/*`: Define Only, Never Execute
    - 3.2.2 `src/main.ts` & `src/main-lightweight.ts`: Entry Points, Wire Everything
    - 3.2.3 `src/stylesheets/` & `public/legacy/*.css`: Commenting Convention
    - 3.2.4 `*.html`: Page Tiers
    - 3.2.5 `*.md`: Document Writing Standards
- [**3.3 Type Definitions**](./instructions/3-project-structural-constraints/3-type-definitions.md) **(MUST READ FIRST)**
    - 3.3.1 Browser Types (`src/types/`)
    - 3.3.2 Build-time Types (`build/types.ts`)
    - 3.3.3 Link-card JSON Format (`build/configs/link-cards/*.json`)

## 4. Feature Reference

- [**4.1 Browser Detection & Compatibility Fallbacks**](./instructions/4-feature-references/1-browser-detection-and-compatibility-fallbacks.md)
- [**4.2 Build-time Injection**](./instructions/4-feature-references/2-build-time-injection.md)
    - 4.2.1 Head Tag Injection
    - 4.2.2 Page Component Injection
    - 4.2.3 Link Card Injection
    - 4.2.4 Asset Minification
- [**4.3 Internationalization (i18n)**](./instructions/4-feature-references/3-internationalization-i18n.md)
    - 4.3.1 i18n Key Naming Conventions
- [**4.4 Theme System**](./instructions/4-feature-references/4-theme-system.md)
    - 4.4.1 Color Variable Naming
- [**4.5 Link Cards**](./instructions/4-feature-references/5-link-cards.md)
- [**4.6 Page Transitions**](./instructions/4-feature-references/6-page-transitions.md)
- [**4.7 Loading Screen**](./instructions/4-feature-references/7-loading-screen.md)
- [**4.8 Settings & Preferences**](./instructions/4-feature-references/8-settings-preferences.md)
- [**4.9 Navigation & Accessibility**](./instructions/4-feature-references/9-navigation-accessibility.md)
- [**4.10 QR Code & Export**](./instructions/4-feature-references/10-qr-code-export.md)
- [**4.11 Fonts & Typography**](./instructions/4-feature-references/11-fonts-typography.md)
    - 4.11.1 Font Variable Naming
    - 4.11.2 Font Stack Design
- [**4.12 Tooltips**](./instructions/4-feature-references/12-tooltips.md)
- [**4.13 Image Utilities**](./instructions/4-feature-references/13-image-utilities.md)
    - 4.13.1 `data-img-feature` Attribute
    - 4.13.2 `follow-theme`
    - 4.13.3 `colored`
    - 4.13.4 `loading-opacity`
- [**4.14 SVG Injection**](./instructions/4-feature-references/14-svg-injection.md)
- [**4.15 Utilities**](./instructions/4-feature-references/15-utilities.md)
- [**4.16 SEO**](./instructions/4-feature-references/16-seo.md)
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
- [**4.17 External Link Confirmation**](./instructions/4-feature-references/17-external-link-confirmation.md)
    - 4.17.1 `data-link-img-props` Attribute
- [**4.18 PWA Splash Screens**](./instructions/4-feature-references/18-pwa-splash-screens.md)

---

## 5. Response Conventions for Copilot

When generating responses for this project, Copilot should:

1. **Think in English**: Internal reasoning and analysis should be in English.
2. **Read the necessary documents**: Instructions are organized in the form of folders. Before generating a response, Copilot should first read the relevant documents in `.github/instructions` according to the user's requirements to understand the specifications of this project.
3. **Respond using the language that the user is using**: For example, if the user is conversing in Chinese, responses should be in Chinese.
4. **Write code / docs / commit messages in English (United States)**: All code, comments, documentation, commit messages should be in English (United States). When writing, use standard ASCII characters as much as possible, like: using `-` instead of `-`, using `->` instead of `→`.
5. **Discuss before executing**: When the user proposes a new function or a change, first explain the approach and analysis. Only proceed with implementation after the user confirms ("go ahead", "执行", "可以", etc.).
6. **Priority of norms/standards**: If there are more normative or standard practices, priority should be given to norms or standards, even if refactoring is required.
