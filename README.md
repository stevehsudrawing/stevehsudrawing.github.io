<div align="center">
  <a href="https://stevehsudrawing.github.io">
    <picture>
      <source
        srcset="public/images/png/favicons/general.png"
        media="(prefers-color-scheme: light)"
      >
      <source
        srcset="public/images/png/favicons/general-dark.png"
        media="(prefers-color-scheme: dark)"
      >
      <img
        alt="Icon of Steve Hsu's Link-Hub"
        src="public/images/png/favicons/general.png"
        width="64"
        height="64"
      >
    </picture>
  </a><br>
  <b>Steve Hsu's Link-Hub</b>
  <p>
    <small>
      A personal link-hub website that consolidates links to all my profiles
      across various platforms
    </small>
  </p>
</div>

---

## 1. Features

- 🧭 **Vue Router SPA navigation**: Instant page switching with URL bar updates,
  back/forward button support, loading bar, and scroll-position restoration.

- 🌐 **Multi-language (i18n)**: Supports English (Default) and Chinese
  (Simplified and Traditional).

- 🌓 **Light / Dark / Auto theme**: Three theme modes with smooth crossfade
  transitions. Theme follows OS preference by default.

- ⚙️ **Customizable settings**: Toggle language, theme, behavior of opening
  external links, and enable or disable animations — whatever you like.

- 📱 **Responsive layout**: Mobile-friendly design with offcanvas sidebar
  navigation and layout difference, powered by Bootstrap 5.3.

- 📋 **Config-driven link cards**: Link cards and button groups defined in JSON
  config files — add or update links without touching HTML.

- 📲 **QR code sharing**: Branded QR codes for any link, one-click PNG download,
  and Web Share API support.

- ♿ **Accessibility**: Skip-to-content button, ARIA attributes, keyboard /
  pointer / touch input mode detection and tooltips.

- 🛡️ **Browser compatibility / 404 guard**: Unsupported browsers, JavaScript-
  disabled users and HTTP 404 will be redirected to fallback page.

- 🔍 **SEO optimized**: Structured data (JSON-LD), Open Graph tags, Twitter
  Cards, hreflang alternates, sitemap, and auto-generated `<noscript>` link
  lists from JSON configs.

## 2. Browser Baseline

| Browser | Min Version | Best Experience |
| ------- | ----------- | --------------- |
| Chrome  | ≥ 61        | ≥ 85            |
| Edge    | ≥ 79        | ≥ 121           |
| Firefox | ≥ 60        | ≥ 93            |
| Opera   | ≥ 48        | ≥ 71            |
| Safari  | ≥ 14        | ≥ 16.1          |

For more details, read [this](.github/instructions/1-tech-stack/3-browser-baseline.instructions.md).

## 3. Tech Stack

| Category           | Choice                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Language           | HTML / CSS / JavaScript / [TypeScript](https://www.typescriptlang.org/)                                             |
| UI Framework       | [Vue 3](https://vuejs.org/) / [bootstrap-vue-next](https://bootstrap-vue-next.github.io/bootstrap-vue-next/)        |
| SPA Routing        | [Vue Router 5](https://router.vuejs.org/)                                                                           |
| Build Tool         | [Vite 8](https://vite.dev/)                                                                                         |
| Package Manager    | [pnpm](https://pnpm.io/)                                                                                            |
| CSS Framework      | [Bootstrap 5.3.8](https://getbootstrap.com/)                                                                        |
| Font               | [Inter Variable](https://github.com/rsms/inter) / [Roboto Mono Variable](https://github.com/googlefonts/RobotoMono) |
| Icons              | [Bootstrap Icons](https://icons.getbootstrap.com/)                                                                  |
| QR Code            | [qrcode](https://github.com/soldair/node-qrcode)                                                                    |
| HTML-to-Image      | [html-to-image](https://github.com/bubkoo/html-to-image)                                                            |
| HTML-to-Canvas     | [html2canvas](https://github.com/niklasvh/html2canvas)                                                              |
| Charts             | [Chart.js](https://www.chartjs.org/)                                                                                |
| Markdown Rendering | [Marked](https://marked.js.org/)                                                                                    |
| Hosting            | [GitHub Pages](https://pages.github.com/)                                                                           |

## 4. Development

```bash
pnpm install # Install dependencies
pnpm dev     # Start dev server (http://localhost:5173)
pnpm build   # Build for production (output: dist/)
pnpm preview # Preview production build locally
```

## 5. Copyright

All original artworks in `public/images/` (including covers, icons, and
stickers) are created by **Steve Hsu (什五)**. See
[public/images/README.md](public/images/README.md) for the full copyright
notice and usage restrictions.
