---
description: >
  Browser baseline: minimum browser versions (Chrome 61+, Edge 79+, Firefox 60+, Opera 48+, Safari 14+),
  per-dependency browser requirements (Bootstrap, qrcode, html-to-image, html2canvas, Popper, HAST),
  and required browser features (ES modules, WebP, WOFF2, variable fonts, AVIF).
  Use when: evaluating browser compatibility, modifying env-detection.js, or changing feature requirements.
applyTo: >
  public/legacy/env-detection.js;
  src/ui/bootstrap-css-detection.ts
---

### 1.3 Browser Baseline

The minimum browser versions are determined by both **npm dependencies** and **browser feature requirements**. Instead of UA-based version checks, the enforced baseline uses feature detection in `public/legacy/env-detection.js` to verify that the browser supports (1) ES modules (`'noModule' in HTMLScriptElement`) and (2) WebP image format (`canvas.toDataURL('image/webp')`). Modern JS syntax (optional chaining, nullish coalescing, etc.) is down-leveled to ES2015 by Vite at build time, so they are no longer a browser requirement.

| Browser | Min Version       | Constrained By          | Best Experience     | Benefiting from |
| ------- | ----------------- | ----------------------- | ------------------- | --------------- |
| Chrome  | ≥ 61 (2016-09-13) | ES modules              | ≥ 85 (2020-08-25)   | AVIF            |
| Edge    | ≥ 79 (2020-01-15) | Bootstrap; Popper; WebP | ≥ 121 (2024-01-26)  | AVIF            |
| Firefox | ≥ 65 (2019-01-29) | WebP                    | ≥ 93 (2021-10-05)   | AVIF            |
| Opera   | ≥ 48 (2017-07-27) | ES modules              | ≥ 71 (2020-09-15)   | AVIF            |
| Safari  | ≥ 14 (2020-09-16) | WebP                    | ≥ 16.1 (2022-10-24) | AVIF            |

#### 1.3.1 Per-Dependency Minimum Browser Versions

| Dependency              | Chrome | Edge   | Firefox | Opera  | Safari |
| ----------------------- | ------ | ------ | ------- | ------ | ------ |
| Bootstrap 5.3.8 CSS/JS  | 60     | **79** | **60**  | 47     | **12** |
| vue-router 5.2.0        | **61** | 16     | 60      | **48** | 11     |
| qrcode 1.5.4            | 1      | 12     | 1.5     | 9      | 2      |
| html-to-image 1.11.13   | 32     | 12     | 29      | 20     | 7.1    |
| html2canvas 1.4.1       | 1      | 12     | 3.5     | 12     | 6      |
| @popperjs/core 2.11.8   | 60     | **79** | **60**  | 47     | **12** |
| hast-util-to-html 9.0.5 | 61     | 16     | 60      | 48     | 11     |

> **Sources**:
>
> - Bootstrap 5.3.8: [Browsers and devices](https://getbootstrap.com/docs/5.3/getting-started/browsers-devices/) - `.browserslistrc` (`Chrome >= 60, Firefox >= 60, Safari >= 12`); IE11 and legacy EdgeHTML not supported
> - qrcode 1.5.4: [npm](https://www.npmjs.com/package/qrcode) - renders to `<canvas>`; requires [Canvas API](https://caniuse.com/canvas) support
> - html-to-image 1.11.13: [GitHub README](https://github.com/bubkoo/html-to-image) - requires `Promise` + SVG `<foreignObject>`
> - html2canvas 1.4.1: [Docs](https://html2canvas.hertzen.com/documentation) - "Chrome all, Firefox 3.5+, Safari 6+, Opera 12+"
> - @popperjs/core 2.11.8: [npm](https://www.npmjs.com/package/@popperjs/core/v/2.11.8) / [Floating UI docs](https://floating-ui.com/) - aligned with Bootstrap 5
> - hast-util-to-html 9.0.5: loaded via `<script type="module">`; requires [ES modules](https://caniuse.com/es6-module) support
> - vue-router 5.2.0: loaded via `<script type="module">`; requires [ES modules](https://caniuse.com/es6-module) support; no additional constraints beyond Vue 3

#### 1.3.2 Browser Feature Requirements

The following browser features are required by this project. Their minimum browser versions are determined by [Can I Use](https://caniuse.com/) support tables (full support across all usage, not partial or behind a flag).

| Enforced | Feature                                                                 | Used By                          | Chrome | Edge      | Firefox | Opera  | Safari |
| -------- | ----------------------------------------------------------------------- | -------------------------------- | ------ | --------- | ------- | ------ | ------ |
| ✓        | [ES modules (`<script type="module">`)](https://caniuse.com/es6-module) | Vite entry point (`src/main.ts`) | **61** | 16        | 60      | **48** | 11     |
| ✓        | [WebP](https://caniuse.com/webp)                                        | Image assets                     | 32     | **79**\*1 | **65**  | 19     | **14** |
|          | [WOFF 2](https://caniuse.com/woff2)                                     | Bootstrap Icons                  | 36     | 14        | 39      | 23     | 10     |
|          | [Variable fonts](https://caniuse.com/variable-fonts)                    | Font display                     | 66     | 17        | 62      | 53     | 11     |
|          | [AVIF](https://caniuse.com/avif)                                        | Image assets (optional)          | _85_   | _121_     | _93_    | _71_   | _16.1_ |

> **Notes**:
>
> 1. "Can I Use" website claims that Edge 18 supports WebP, but practical tests have shown that **it does not**.
