### 1.2 External Dependencies (npm, bundled by Vite)

All dependencies are installed via pnpm and imported in [`src/main.ts`](src/main.ts). No CDN `<link>` or `<script>` tags are used.

| Resource                   | npm Package            | Role               | GitHub Repo                                                                         | Version |
|----------------------------|------------------------|--------------------|-------------------------------------------------------------------------------------|---------|
| Bootstrap                  | `bootstrap`            | Page Framework     | [`twbs/bootstrap`](https://github.com/twbs/bootstrap)                               | 5.3.8   |
| Bootstrap Icons            | `bootstrap-icons`      | Icon Library       | [`twbs/icons`](https://github.com/twbs/icons)                                       | 1.11.3  |
| @popperjs/core             | `@popperjs/core`       | Positioning Engine | [`vusion/popper.js`](https://github.com/vusion/popper.js/)                          | 2.11.8  |
| Inter Font                 | `@fontsource/inter`    | Font Family        | [`rsms/inter`](https://github.com/rsms/inter)                                       | 5.3.0   |
| qrcode                     | `qrcode`               | QR Code Utility    | [`soldair/node-qrcode`](https://github.com/soldair/node-qrcode)                     | 1.5.4   |
| html-to-image              | `html-to-image`        | HTML -> Image      | [`bubkoo/html-to-image`](https://github.com/bubkoo/html-to-image)                   | 1.11.13 |
| html2canvas                | `html2canvas`          | HTML -> Canvas     | [`niklasvh/html2canvas`](https://github.com/niklasvh/html2canvas)                   | 1.4.1   |
| hast-util-to-html          | `hast-util-to-html`    | HAST -> HTML       | [`syntax-tree/hast-util-to-html`](https://github.com/syntax-tree/hast-util-to-html) | 9.0.5   |
| html-minifier-terser (dev) | `html-minifier-terser` | HTML Minifier      | [`terser/html-minifier-terser`](https://github.com/terser/html-minifier-terser)     | 7.2.0   |
| TypeScript (dev)           | `typescript`           | Type Checking      | [`microsoft/TypeScript`](https://github.com/microsoft/TypeScript)                   | 7.0.2   |
| Vite (dev only)            | `vite`                 | Build Tool         | [`vitejs/vite`](https://github.com/vitejs/vite)                                     | 8.1.5   |

