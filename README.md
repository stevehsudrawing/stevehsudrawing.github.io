<div align="center">
	<img alt="Icon of Steve Hsu's Link-Hub" src="images/favicon.png" width="64" height="64"><br>
	<a href="https://stevehsudrawing.github.io">Steve Hsu's Link-Hub</a>
</div>
<br>

A personal link-hub website that consolidates links to all my profiles across various platforms. Built with vanilla HTML, CSS, and JavaScript, deployed via GitHub Pages.

---

## Features

- 🌐 **Multi-language (i18n)**: Language preference is persisted and all UI strings are loaded dynamically from JSON translation files. The list of supported language is [here](configs/language-list.json).
- 🌓 **Light / Dark / Auto theme**: Three theme modes: light, dark, or follow the OS preference. Theme is persisted via `localStorage` and applied instantly.
- 🔗 **Configurable external link behavior**: Users can toggle whether external links open in new tabs. Preference is persisted.
- ✨ **SPA-style page transitions**: Internal navigation triggers a smooth progress-bar animation and content dimming, providing an app-like experience without a front-end framework.
- 📱 **Responsive layout**: Powered by Bootstrap 5.3, the layout adapts to all screen sizes.
- 📋 **Dynamic link cards**: Link cards are defined in JSON config files and rendered at runtime, making it easy to add or update links without touching HTML.
- 📲 **QR code sharing**: QR codes are generated on the fly via QRCode.js inside a branded share card, with one-click download as a PNG image via html-to-image.
- ♿ **Accessibility**: Includes a skip-to-content button, ARIA attributes, keyboard-friendly focus management, and Bootstrap tooltips.
- 🛡️ **Browser detection & fallback**: Unsupported browsers are detected (via ES5-compatible script) and redirected to a dedicated fallback page that works without CDN dependencies.
- 🚫 **Custom 404 page**: A styled error page with lightweight initialization.

## Tech Stack

| Category       | Choice                                               |
|----------------|------------------------------------------------------|
| Page Framework | [Bootstrap 5.3.8](https://getbootstrap.com/)         |
| Icons          | [Bootstrap Icons](https://icons.getbootstrap.com/)   |
| Font           | [Inter](https://github.com/rsms/inter)               |
| QR Code        | [QRCode.js](https://github.com/davidshimjs/qrcodejs) |
| HTML-to-Image  | [html-to-image](https://github.com/bubkoo/html-to-image) |
| Hosting        | [GitHub Pages](https://pages.github.com/)            |

## Project Structure

```
/
├── configs/
│   ├── language-list.json        # Supported languages
│   ├── i18n/                     # Translation JSON files
│   └── links/                    # Link-card data per page
├── images/
│   ├── covers/                   # Cover images
│   ├── icons/                    # Icon images
│   ├── stickers/                 # Sticker artwork
│   └── README.md                 # Copyright notice for original artworks
├── scripts/
│   ├── detections/               # Browser/environment detection (ES5)
│   ├── functions/                # Reusable modules
│   ├── init-at-head.js           # Synchronous init in <head>
│   ├── init-final.js             # Full initialization (all features)
│   └── init-final-lightweight.js # Lightweight init (no page transitions)
├── stylesheets/
│   ├── base.css                  # Reset, layout, typography
│   ├── color-scheme.css          # Light/dark theme CSS custom properties
│   ├── components.css            # Component styles
│   ├── fonts.css                 # Font face declarations
│   └── mono-img.css              # Monochrome image utilities
├── sub-pages/                    # HTML fragments loaded at runtime
│   ├── header.html
│   ├── footer.html
│   ├── footer-lightweight.html
│   └── modals.html
├── index.html                    # Homepage
├── about.html
├── artworks-and-videos.html
├── blogs-and-sponsor.html
├── chatting.html
├── softwares.html
├── 404.html                      # HTTP 404 error page
├── unsupported.html              # Fallback for unsupported browsers
└── robots.txt
```

## Copyright

All original artworks in `images/` (including covers, icons, and stickers) are created by **Steve Hsu (什五)**. See [images/README.md](images/README.md) for the full copyright notice and usage restrictions.
