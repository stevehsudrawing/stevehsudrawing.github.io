# License

Copyright (c) 2024-2026 Steve Hsu (什五). All rights reserved.

This repository is **source-available, not open source**. It is published
publicly as a reference for the live website at <https://stevehsu.link>. Except
for the permission expressly granted in [§3](#3-permitted-use), no license or
permission of any kind is granted to use, copy, modify, adapt, publish,
distribute, sublicense, sell, or deploy any part of this repository. All rights
are reserved.

## 1. Scope

This license covers the source code, build scripts, configuration, text, and
documentation in this repository, except for the material excluded in
[§2](#2-exclusions).

## 2. Exclusions

- **Original artworks** under `public/images/**` are not covered by this
  license. Their terms, including works offered under the CC BY-NC 4.0 license,
  are defined in `public/images/README.md`.
- **Third-party components** (dependencies, brand logos, social-media icons, and
  other third-party trademarks) remain the property of their respective owners
  and are governed by their own licenses.
- **What the built site redistributes** carries each work's license text with
  it, served from `public/licenses/`. Every other dependency is a build-time
  tool whose output is a file in the build, never code in it.

| Work                                                                             | Use                                                                                                              | License                   | Copyright                                                                                 |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| [Vue](public/licenses/vue-LICENSE.txt)                                           | The component model, the reactive core and the DOM renderer                                                      | MIT                       | Copyright (c) 2018-present, Yuxi (Evan) You                                               |
| [Vue Router](public/licenses/vue-router-LICENSE.txt)                             | Client-side routing, scroll restoration and the navigation guards                                                | MIT                       | Copyright (c) 2019-present Eduardo San Martin Morote                                      |
| [Bootstrap](public/licenses/bootstrap-LICENSE.txt)                               | The compiled CSS: Reboot, the grid, the utilities and the component styles                                       | MIT                       | Copyright (c) 2011-2025 The Bootstrap Authors                                             |
| [BootstrapVueNext](public/licenses/bootstrap-vue-next-LICENSE.txt)               | The Vue components the pages and modals are built from                                                           | MIT                       | Copyright (c) BootstrapVueNext                                                            |
| [Floating UI](public/licenses/floating-ui-LICENSE.txt)                           | Tooltip and dropdown positioning, published inside BootstrapVueNext's bundle as `core`, `dom`, `utils` and `vue` | MIT                       | Copyright (c) 2021-present Floating UI contributors                                       |
| [VueUse](public/licenses/vueuse-LICENSE.txt)                                     | Event and element helpers, inside that bundle as `core`, `shared` and `integrations`                             | MIT                       | Copyright (c) 2019-present Anthony Fu                                                     |
| [focus-trap](public/licenses/focus-trap-LICENSE.txt)                             | The keyboard trap that holds focus in an open modal, inside that bundle                                          | MIT                       | Copyright (c) 2015-2016 David Clark                                                       |
| [tabbable](public/licenses/tabbable-LICENSE.txt)                                 | The tabbable-node walk the trap runs on, inside that bundle                                                      | MIT                       | Copyright (c) 2015 David Clark                                                            |
| [HAST utilities](public/licenses/hast-LICENSE.txt)                               | Serializing HAST back to HTML for the generated section headings (11 packages)                                   | MIT                       | See the file, which carries each package's own line                                       |
| [html-to-image](public/licenses/html-to-image-LICENSE.txt)                       | PNG export for the QR card                                                                                       | MIT                       | Copyright (c) 2017-2025 W.Y.                                                              |
| [qrcode](public/licenses/qrcode-LICENSE.txt)                                     | The QR code canvas in the QR modal                                                                               | MIT                       | Copyright (c) 2012 Ryan Day                                                               |
| [dijkstrajs](public/licenses/dijkstrajs-LICENSE.txt)                             | The shortest-path search behind qrcode's mask selection                                                          | MIT                       | Copyright (C) 2008 Wyatt Baldwin                                                          |
| [Chart.js](public/licenses/chart.js-LICENSE.txt)                                 | The GitHub activity chart                                                                                        | MIT                       | Copyright (c) 2014-2024 Chart.js Contributors                                             |
| [@kurkle/color](public/licenses/kurkle-color-LICENSE.txt)                        | Color parsing for Chart.js                                                                                       | MIT                       | Copyright (c) 2018-2024 Jukka Kurkela                                                     |
| [chartjs-adapter-date-fns](public/licenses/chartjs-adapter-date-fns-LICENSE.txt) | The time axis for that chart                                                                                     | MIT                       | Copyright (c) 2019 Chart.js Contributors                                                  |
| [date-fns](public/licenses/date-fns-LICENSE.txt)                                 | Date arithmetic behind the chart axis and the changelog's relative times                                         | MIT                       | Copyright (c) 2021 Sasha Koss and Lesha Koss                                              |
| [three.js](public/licenses/three-LICENSE.txt)                                    | The WebGL renderer under the skin viewer                                                                         | MIT                       | Copyright © 2010-2023 three.js authors                                                    |
| [skinview3d](public/licenses/skinview3d-LICENSE.txt)                             | The 3D skin and cape viewer                                                                                      | MIT                       | Copyright (c) 2014-2018 Kent Rasmussen; 2017-2022 Haowei Wen, Sean Boult and contributors |
| [skinview-utils](public/licenses/skinview-utils-LICENSE.txt)                     | Skin and cape texture helpers for that viewer                                                                    | MIT                       | As skinview3d                                                                             |
| [skinview3d-etf](public/licenses/skinview3d-etf-LICENSE.txt)                     | The ETF blink animation layered on the viewer                                                                    | MIT                       | Copyright (c) 2026 Steve Hsu (什五)                                                       |
| [etf-skin-decoder](public/licenses/etf-skin-decoder-LICENSE.txt)                 | The ETF skin decoder behind that animation                                                                       | MIT                       | Copyright (c) 2026 Steve Hsu (什五)                                                       |
| [skinview3d-blockbench](public/licenses/skinview3d-blockbench-LICENSE.txt)       | Blockbench model and cape loading in the viewer                                                                  | MIT                       | Copyright (c) 2026 AndcoolSystems                                                         |
| [Swiper](public/licenses/swiper-LICENSE.txt)                                     | The hero carousel and the group lightbox                                                                         | MIT                       | Copyright (c) 2019 Vladimir Kharlampidi                                                   |
| [Panzoom](public/licenses/panzoom-LICENSE.txt)                                   | Pan and zoom in the single-image viewer                                                                          | MIT                       | Copyright 2016-2019 Timmy Willison                                                        |
| [canvas-confetti](public/licenses/canvas-confetti-LICENSE.txt)                   | The confetti burst in the sticker modal                                                                          | ISC                       | Copyright (c) 2020, Kiril Vatev                                                           |
| [Inter](public/licenses/inter-LICENSE.txt)                                       | The Latin webfonts for prose, and the `@font-face` rules that serve them                                         | SIL Open Font License 1.1 | Copyright (c) 2016 The Inter Project Authors                                              |
| [Roboto Mono](public/licenses/roboto-mono-LICENSE.txt)                           | The Latin webfonts for code, and the `@font-face` rules that serve them                                          | SIL Open Font License 1.1 | Copyright (c) 2015 The Roboto Mono Project Authors                                        |
| [Material Symbols](public/licenses/material-symbols-LICENSE.txt)                 | The icon webfont, subset from the Outlined variable font at build time                                           | Apache License 2.0        | Copyright Google LLC                                                                      |

Four of those arrive inside another work's published bundle rather than through
this repository's dependencies: BootstrapVueNext publishes Floating UI's,
VueUse's, focus-trap's and tabbable's code inside its own.

The HAST utilities share one file because they are one toolchain: each package
keeps its own heading, copyright line and license text inside it.

## 3. Permitted Use

You may view the live website and read the source materials as presented on
GitHub. This is the only permission granted; it does not extend to any copying,
modification, distribution, hosting, or deployment of the materials.

## 4. Prohibited Use

Without prior written permission from the author, you may not:

- copy, reproduce, mirror, or otherwise duplicate any part of the materials;
- modify, adapt, translate, or create derivative works based on them;
- redistribute, sublicense, or sell them, in source or built form;
- deploy, host, publish, or otherwise make them available as a website or online
  service, including republishing them under a different name, account, or
  domain;
- remove or alter any copyright notice, attribution, or watermark.

## 5. Note on GitHub

This is a public repository hosted on GitHub. GitHub's Terms of Service allow
other users to view and fork public repositories through GitHub's own
functionality. Any such fork is limited to display within GitHub and grants no
rights beyond those described in [§3](#3-permitted-use); all other rights remain
reserved.

## 6. AI / Machine Learning

The materials may not be used as training data, fine-tuning data, or input for
any artificial-intelligence or machine-learning model, dataset, or system.

## 7. Contributions

No contributions are accepted; please do not submit pull requests or patches.

## 8. Disclaimer

The materials are published "as is", without warranty of any kind, express or
implied. The author is not liable for any claim, damage, or other liability
arising from any use of the materials.

## 9. Contact

For permission requests, contact Steve Hsu (什五) at
[stevehsudrawing@outlook.com](mailto:stevehsudrawing@outlook.com).
