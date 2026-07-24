### 4.2 Component Loading

**Brief**: Dynamically loads reusable HTML fragments (header, footer, modals) into placeholder elements on each page.

**Related Files**:

| File                                             | Role                                |
|--------------------------------------------------|-------------------------------------|
| `src/core/component-loader.ts`                   | Fetches and injects HTML fragments  |
| `public/page-components/header.html`             | Header fragment                     |
| `public/page-components/footer.html`             | Footer fragment (full pages)        |
| `public/page-components/footer-lightweight.html` | Footer fragment (lightweight pages) |
| `public/page-components/modals.html`             | Settings and QR code modals         |

**How It Works**:

```
HTML: <div data-role="page-component" data-component-name="header"></div>
        ↓ (component-loader.ts at init time)
      Reads data-component-name="header" → fetches /page-components/header.html → injects innerHTML
```

- Elements with `data-role="page-component"` serve as placeholders.
- The component loader reads `data-component-name` to derive the file path: `/page-components/{name}.html`.
- The `data-component-name` value must match the HTML fragment filename (without extension).


