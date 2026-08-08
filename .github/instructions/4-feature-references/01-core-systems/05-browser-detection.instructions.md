---
description: >
  Browser detection & compatibility: env-detection.js for legacy browser checks,
  minimum browser versions (Chrome 61+, Edge 79+, Firefox 60+, Safari 14+),
  Bootstrap CSS detection (src/platform/bootstrap-css-detection.ts).
  Use when: evaluating browser compatibility or modifying detection scripts.
applyTo: >
  public/legacy/env-detection.js;
  src/platform/bootstrap-css-detection.ts
---

#### 4.1.5 Browser Detection & Compatibility

##### 4.1.5.1 Minimum Browser Versions

| Browser | Minimum Version |
| ------- | --------------- |
| Chrome  | 61+             |
| Edge    | 79+             |
| Firefox | 60+             |
| Opera   | 48+             |
| Safari  | 14+             |

##### 4.1.5.2 env-detection.js

`public/legacy/env-detection.js` runs synchronously before any other script.
It checks for required browser features (ES modules, WebP, WOFF2, variable
fonts, AVIF) and redirects to `error-unsupported-browser.html` if the
browser is too old.

##### 4.1.5.3 Bootstrap CSS Detection

`src/platform/bootstrap-css-detection.ts` (`initBootstrapCSSDetection()`) checks
whether Bootstrap CSS loaded successfully by testing for a known Bootstrap
class. Called from `App.vue`'s `onMounted`.
