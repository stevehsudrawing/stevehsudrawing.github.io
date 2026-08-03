---
description: >
  External npm dependencies: production (Bootstrap, Bootstrap Icons, Popper, Inter & Roboto Mono fonts,
  qrcode, html-to-image, html2canvas, HAST utilities) and dev (TypeScript, Vite, html-minifier-terser,
  @types/*, Husky, lint-staged, Prettier). Dependency principle: prefer well-maintained lightweight
  libraries over hand-rolled workarounds.
  Use when: adding/removing/updating dependencies, evaluating new libraries, or modifying package.json.
applyTo: >
  package.json;
  pnpm-lock.yaml;
  src/main.ts
---

### 1.2 External Dependencies

All dependencies are installed via pnpm. No CDN `<link>` or `<script>` tags are used.

#### 1.2.1 Production Dependencies

Production dependencies are bundled and shipped to the browser. They are imported in [`src/main.ts`](src/main.ts).

| Resource            | npm Package                        | Role                     | GitHub Repo                                                                                         | Version |
| ------------------- | ---------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- | ------- |
| Vue                 | `vue`                              | UI Framework             | [`vuejs/core`](https://github.com/vuejs/core)                                                       | 3.5.40  |
| bootstrap-vue-next  | `bootstrap-vue-next`               | Bootstrap Vue Components | [`bootstrap-vue-next/bootstrap-vue-next`](https://github.com/bootstrap-vue-next/bootstrap-vue-next) | 0.45.9  |
| Bootstrap           | `bootstrap`                        | Page Framework           | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)                                               | 5.3.8   |
| Bootstrap Icons     | `bootstrap-icons`                  | Icon Library             | [`twbs/icons`](https://github.com/twbs/icons)                                                       | 1.11.3  |
| Popper.js           | `@popperjs/core`                   | Positioning Engine       | [`vusion/popper.js`](https://github.com/vusion/popper.js/)                                          | 2.11.8  |
| Inter Font          | `@fontsource-variable/inter`       | Sans-serif Font          | [`rsms/inter`](https://github.com/rsms/inter)                                                       | 5.3.0   |
| Roboto Mono Font    | `@fontsource-variable/roboto-mono` | Monospace Font           | [`googlefonts/RobotoMono`](https://github.com/googlefonts/RobotoMono)                               | 5.3.0   |
| qrcode              | `qrcode`                           | QR Code Generation       | [`soldair/node-qrcode`](https://github.com/soldair/node-qrcode)                                     | 1.5.4   |
| html-to-image       | `html-to-image`                    | DOM -> PNG Export        | [`bubkoo/html-to-image`](https://github.com/bubkoo/html-to-image)                                   | 1.11.13 |
| html2canvas         | `html2canvas`                      | DOM -> Canvas (fallback) | [`niklasvh/html2canvas`](https://github.com/niklasvh/html2canvas)                                   | 1.4.1   |
| hast-util-from-html | `hast-util-from-html`              | HTML -> HAST Parser      | [`syntax-tree/hast-util-from-html`](https://github.com/syntax-tree/hast-util-from-html)             | 2.0.3   |
| hast-util-to-html   | `hast-util-to-html`                | HAST -> HTML Serializer  | [`syntax-tree/hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html)                 | 9.0.5   |
| hastscript          | `hastscript`                       | HAST Node Builder        | [`syntax-tree/hastscript`](https://github.com/syntax-tree/hastscript)                               | 9.0.1   |

#### 1.2.2 Development Dependencies

Dev-only dependencies are used at build time or during development. They are **not** shipped to the browser.

| Resource                   | npm Package                   | Role                       | GitHub Repo                                                                               | Version |
| -------------------------- | ----------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- | ------- |
| TypeScript                 | `typescript`                  | Type Checking              | [`microsoft/TypeScript`](https://github.com/microsoft/TypeScript)                         | 7.0.2   |
| Vite                       | `vite`                        | Build Tool                 | [`vitejs/vite`](https://github.com/vitejs/vite)                                           | 8.1.5   |
| Vue Vite Plugin            | `@vitejs/plugin-vue`          | Vue SFC Compiler           | [`vitejs/vite-plugin-vue`](https://github.com/vitejs/vite-plugin-vue)                     | 6.0.8   |
| Vue Components Resolver    | `unplugin-vue-components`     | Auto-import Vue Components | [`unplugin/unplugin-vue-components`](https://github.com/unplugin/unplugin-vue-components) | 28.8.0  |
| html-minifier-terser       | `html-minifier-terser`        | HTML Minifier              | [`terser/html-minifier-terser`](https://github.com/terser/html-minifier-terser)           | 7.2.0   |
| Bootstrap Type Definitions | `@types/bootstrap`            | Bootstrap TS types         | [`DefinitelyTyped/DefinitelyTyped`](https://github.com/DefinitelyTyped/DefinitelyTyped)   | 5.2.11  |
| html-minifier-terser Types | `@types/html-minifier-terser` | Minifier TS types          | [`DefinitelyTyped/DefinitelyTyped`](https://github.com/DefinitelyTyped/DefinitelyTyped)   | 7.0.2   |
| Node.js Type Definitions   | `@types/node`                 | Node.js TS types           | [`DefinitelyTyped/DefinitelyTyped`](https://github.com/DefinitelyTyped/DefinitelyTyped)   | 26.1.1  |
| QR Code Type Definitions   | `@types/qrcode`               | QR Code TS types           | [`DefinitelyTyped/DefinitelyTyped`](https://github.com/DefinitelyTyped/DefinitelyTyped)   | 1.5.6   |
| Husky                      | `husky`                       | Git Hooks Manager          | [`typicode/husky`](https://github.com/typicode/husky)                                     | 9.1.7   |
| lint-staged                | `lint-staged`                 | Staged File Linter         | [`lint-staged/lint-staged`](https://github.com/lint-staged/lint-staged)                   | 17.2.0  |
| Prettier                   | `prettier`                    | Code Formatter             | [`prettier/prettier`](https://github.com/prettier/prettier)                               | 3.9.6   |

#### 1.2.3 Dependency Principle

Prefer adding a well-maintained, lightweight external dependency when it significantly improves code maintainability, correctness, or readability. Hand-rolling fragile workarounds (regex-based HTML parsing, manual attribute escaping, etc.) is more error-prone than using a purpose-built library. Prefer dependencies from the same ecosystem (e.g., unified/syntax-tree for HAST manipulation) to minimize integration risk.
