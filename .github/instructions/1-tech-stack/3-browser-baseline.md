### 1.3 Browser Baseline

The minimum browser versions are determined by both **npm dependencies** and **browser feature requirements**. Instead of UA-based version checks, the enforced baseline uses feature detection (`new Function('return 0?.x')`) in `public/legacy/env-detection.js` to verify that the JS engine supports optional chaining.

| Browser | Min Version | Release Date | Constrained By           |
|---------|-------------|--------------|--------------------------|
| Chrome  | ≥ 80        | 2020-02-04   | Optional chaining (`?.`) |
| Edge    | ≥ 80        | 2020-02-07   | Optional chaining (`?.`) |
| Firefox | ≥ 74        | 2020-03-10   | Optional chaining (`?.`) |
| Opera   | ≥ 67        | 2020-02-25   | Optional chaining (`?.`) |
| Safari  | ≥ 14        | 2020-09-16   | WebP                     |

#### 1.3.1 Per-Dependency Minimum Browser Versions

| Dependency              | Chrome | Edge   | Firefox | Opera  | Safari |
|-------------------------|--------|--------|---------|--------|--------|
| Bootstrap 5.3.8 CSS/JS  | **60** | **79** | **60**  | **47** | **12** |
| qrcode 1.5.4            | 1      | 12     | 1.5     | 9      | 2      |
| html-to-image 1.11.13   | 32     | 12     | 29      | 20     | 7.1    |
| html2canvas 1.4.1       | 1      | 12     | 3.5     | 12     | 6      |
| @popperjs/core 2.11.8   | **60** | **79** | **60**  | **47** | **12** |
| hast-util-to-html 9.0.5 | 61     | 16     | 60      | 48     | 11     |

> **Sources**:
> - Bootstrap 5.3.8: [Browsers and devices](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/) - `.browserslistrc` (`Chrome >= 60, Firefox >= 60, Safari >= 12`); IE11 and legacy EdgeHTML not supported
> - qrcode 1.5.4: [npm](https://www.npmjs.com/package/qrcode) - renders to `<canvas>`; requires [Canvas API](https://caniuse.com/canvas) support
> - html-to-image 1.11.13: [GitHub README](https://github.com/bubkoo/html-to-image) - requires `Promise` + SVG `<foreignObject>`
> - html2canvas 1.4.1: [Docs](https://html2canvas.hertzen.com/documentation) - "Chrome all, Firefox 3.5+, Safari 6+, Opera 12+"
> - @popperjs/core 2.11.8: [npm](https://www.npmjs.com/package/@popperjs/core/v/2.11.8) / [Floating UI docs](https://floating-ui.com/) - aligned with Bootstrap 5
> - hast-util-to-html 9.0.5: loaded via `<script type="module">`; requires [ES modules](https://caniuse.com/es6-module) support

#### 1.3.2 Browser Feature Requirements

The following browser features are required by this project. Their minimum browser versions are determined by [Can I Use](https://caniuse.com/) support tables (full support across all usage, not partial or behind a flag).

| Feature                                                                                    | Used By                          | Chrome | Edge   | Firefox | Opera  | Safari |
|--------------------------------------------------------------------------------------------|----------------------------------|--------|--------|---------|--------|--------|
| [Optional chaining (`?.`)](https://caniuse.com/mdn-javascript_operators_optional_chaining) | Any TS Scripts in `src/`         | **80** | **80** | **74**  | **67** | 13.1   |
| [WebP](https://caniuse.com/webp)                                                           | Image assets                     | 32     | 18     | 65      | 19     | **14** |
| [WOFF 2](https://caniuse.com/woff2)                                                        | Bootstrap Icons                  | 36     | 14     | 39      | 23     | 10     |
| [Variable fonts](https://caniuse.com/variable-fonts)                                       | Inter                            | 66     | 17     | 62      | 53     | 11     |
| [ES modules (`<script type="module">`)](https://caniuse.com/es6-module)                    | Vite entry point (`src/main.ts`) | 61     | 16     | 60      | 48     | 11     |

