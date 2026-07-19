<div align="center">
	<img alt="Icon of Steve Hsu's Link-Hub" src="images/favicon.png" width="64" height="64"><br>
	<a href="https://stevehsudrawing.github.io">Steve Hsu's Link-Hub</a>
</div>
<br>

A personal link-hub website that consolidates links to all my profiles across various platforms. Built with vanilla HTML, CSS, and JavaScript, deployed via GitHub Pages.

---

## 1. Features

- 🌐 **Multi-language (i18n)**: Supports English and Chinese (both Simplified and Traditional). Language preference is persisted and auto-detected from the URL or system settings.
- 🌓 **Light / Dark / Auto theme**: Three theme modes with instant switching. Theme follows the OS preference by default.
- ⚙️ **Customizable settings**: Toggle external links to always open in new tabs, and enable or disable animations. Preferences are saved locally.
- ✨ **SPA-style page transitions**: Smooth animated transitions between internal pages with a progress bar, no front-end framework required.
- 📱 **Responsive layout**: Adapts to all screen sizes, powered by Bootstrap 5.3.
- 📋 **Config-driven link cards**: Link cards are defined in JSON config files and rendered at runtime — add or update links without touching HTML.
- 📲 **QR code sharing**: Generate branded QR codes for any link, with one-click download as a PNG image.
- ♿ **Accessibility**: Skip-to-content button, ARIA attributes, keyboard-friendly focus management, and tooltips.
- 🛡️ **Browser compatibility guard**: Unsupported browsers are detected early and redirected to a fallback page. JavaScript-disabled users are also redirected to a dedicated error page.
- 🔍 **SEO optimized**: Structured data (JSON-LD), Open Graph tags, Twitter/X Cards, hreflang alternates, sitemap, and semantic heading hierarchy across all pages.
- 🚫 **Custom 404 page**: A styled error page with lightweight loading for a graceful fallback.

## 2. Browser Baseline

| Browser | Min Version |
|---------|-------------|
| Chrome  | ≥ 80        |
| Edge    | ≥ 80        |
| Firefox | ≥ 74        |
| Opera   | ≥ 67        |
| Safari  | ≥ 14        |

For more details, read [this](.github/copilot-instructions.md#13-browser-baseline).

## 3. Tech Stack

| Category       | Choice                                                   |
|----------------|----------------------------------------------------------|
| Page Framework | [Bootstrap 5.3.8](https://getbootstrap.com/)             |
| Icons          | [Bootstrap Icons](https://icons.getbootstrap.com/)       |
| Font           | [Inter](https://github.com/rsms/inter)                   |
| QR Code        | [QRCode.js](https://github.com/davidshimjs/qrcodejs)     |
| HTML-to-Image  | [html-to-image](https://github.com/bubkoo/html-to-image) |
| HTML-to-Canvas | [html2canvas](https://github.com/niklasvh/html2canvas)   |
| Hosting        | [GitHub Pages](https://pages.github.com/)                |

## 4. Copyright

All original artworks in `images/` (including covers, icons, and stickers) are created by **Steve Hsu (什五)**. See [images/README.md](images/README.md) for the full copyright notice and usage restrictions.
