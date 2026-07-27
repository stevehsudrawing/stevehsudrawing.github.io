---
description: >
  External npm dependencies (Bootstrap, Bootstrap Icons, Popper, Inter font, qrcode, html-to-image,
  html2canvas, HAST utilities, html-minifier-terser, TypeScript, Vite) and the dependency principle:
  prefer well-maintained lightweight libraries over hand-rolled workarounds.
  Use when: adding/removing/updating dependencies, evaluating new libraries, or modifying package.json.
applyTo: >
  package.json;
  pnpm-lock.yaml;
  src/main.ts;
  src/main-lightweight.ts
---

### 1.2 External Dependencies

All dependencies are installed via pnpm and imported in [`src/main.ts`](src/main.ts). No CDN `<link>` or `<script>` tags are used.

| Resource                   | npm Package                        | Role                  | GitHub Repo                                                                             | Version |
| -------------------------- | ---------------------------------- | --------------------- | --------------------------------------------------------------------------------------- | ------- |
| Bootstrap                  | `bootstrap`                        | Page Framework        | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)                                   | 5.3.8   |
| Bootstrap Icons            | `bootstrap-icons`                  | Icon Library          | [`twbs/icons`](https://github.com/twbs/icons)                                           | 1.11.3  |
| @popperjs/core             | `@popperjs/core`                   | Positioning Engine    | [`vusion/popper.js`](https://github.com/vusion/popper.js/)                              | 2.11.8  |
| Inter Font                 | `@fontsource-variable/inter`       | Font Family           | [`rsms/inter`](https://github.com/rsms/inter)                                           | 5.3.0   |
| Roboto Mono Font           | `@fontsource-variable/roboto-mono` | Monospace Font Family | [`googlefonts/RobotoMono`](https://github.com/googlefonts/RobotoMono)                   | 5.3.0   |
| qrcode                     | `qrcode`                           | QR Code Utility       | [`soldair/node-qrcode`](https://github.com/soldair/node-qrcode)                         | 1.5.4   |
| html-to-image              | `html-to-image`                    | HTML -> Image         | [`bubkoo/html-to-image`](https://github.com/bubkoo/html-to-image)                       | 1.11.13 |
| html2canvas                | `html2canvas`                      | HTML -> Canvas        | [`niklasvh/html2canvas`](https://github.com/niklasvh/html2canvas)                       | 1.4.1   |
| hast-util-from-html        | `hast-util-from-html`              | HTML -> HAST          | [`syntax-tree/hast-util-from-html`](https://github.com/syntax-tree/hast-util-from-html) | 2.0.3   |
| hast-util-to-html          | `hast-util-to-html`                | HAST -> HTML          | [`syntax-tree/hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html)     | 9.0.5   |
| hastscript                 | `hastscript`                       | HAST node builder     | [`syntax-tree/hastscript`](https://github.com/syntax-tree/hastscript)                   | 9.0.1   |
| html-minifier-terser (dev) | `html-minifier-terser`             | HTML Minifier         | [`terser/html-minifier-terser`](https://github.com/terser/html-minifier-terser)         | 7.2.0   |
| TypeScript (dev)           | `typescript`                       | Type Checking         | [`microsoft/TypeScript`](https://github.com/microsoft/TypeScript)                       | 7.0.2   |
| Vite (dev only)            | `vite`                             | Build Tool            | [`vitejs/vite`](https://github.com/vitejs/vite)                                         | 8.1.5   |

#### 1.2.1 Dependency Principle

Prefer adding a well-maintained, lightweight external dependency when it significantly improves code maintainability, correctness, or readability. Hand-rolling fragile workarounds (regex-based HTML parsing, manual attribute escaping, etc.) is more error-prone than using a purpose-built library. Prefer dependencies from the same ecosystem (e.g., unified/syntax-tree for HAST manipulation) to minimize integration risk.
