---
description: >
  PWA splash screens: Apple PWA splash screen image generation for 23 device resolutions from a
  single square prototype image via Python script (generate_splash.py), injected as
  apple-touch-startup-image link tags with media queries in fullPageTags(). SPLASH_SCREENS table
  in vite.config.ts maps pixel dimensions to CSS point dimensions.
  Use when: modifying splash screen generator, splash images, or vite.config.ts splash screen config.
applyTo: >
  vite.config.ts;
  tools/apple-pwa-splash-generator/**;
  public/images/png/splash/**;
  public/manifest.json
---

### 4.18 PWA Splash Screens

**Brief**: Generates Apple PWA splash screen images for 23 device resolutions from a single square prototype image. The images are injected as `<link rel="apple-touch-startup-image">` tags in `fullPageTags()`.

**Related Files**:

| File                                                  | Role                                         |
| ----------------------------------------------------- | -------------------------------------------- |
| `vite.config.js`                                      | `SPLASH_SCREENS` data table + `splashTags()` |
| `tools/apple-pwa-splash-generator/generate_splash.py` | Python script to generate splash images      |
| `tools/apple-pwa-splash-generator/prototype.png`      | Source prototype (square, ≥ 1536×1536 px)    |
| `public/images/png/splash/`                           | Generated output images (23 files)           |

**How It Works**:

```
prototype.png (square, e.g. 2000×2000)
  ↓ generate_splash.py
For each of 23 unique device resolutions:
  1. Create white (#ffffff) canvas at target pixel dimensions.
  2. Scale prototype so its larger side = 50 % of canvas's smaller side.
  3. Center scaled prototype on canvas.
  4. Save as apple-splash-{width}-{height}.png.
  ↓
Images placed in public/images/png/splash/
  ↓ splashTags() in vite.config.js
Generates <link> tags with media queries:
  <link rel="apple-touch-startup-image"
        href="/images/png/splash/apple-splash-2064-2752.png"
        media="(device-width: 1032px) and (device-height: 1376px)
               and (-webkit-device-pixel-ratio: 2)
               and (orientation: portrait)">
```

**SPLASH_SCREENS Table**: Each entry maps pixel dimensions → CSS point dimensions → pixel ratio, sourced from Apple's Human Interface Guidelines. Only unique pixel resolutions are listed (deduplicated across device models). Portrait orientation only.
