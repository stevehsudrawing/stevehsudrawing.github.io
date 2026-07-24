### 4.3 Internationalization (i18n)

**Brief**: Provides multi-language support for all user-facing text. Translations are stored in JSON files and applied at runtime by rewriting DOM elements with `data-i18n` attributes.

**Related Files**:

| File                                | Role                                                  |
|-------------------------------------|-------------------------------------------------------|
| `src/core/i18n.ts`                  | Language loading, text replacement, language switcher |
| `public/configs/language-list.json` | List of supported language codes                      |
| `public/configs/i18n/{lang}.json`   | Translation key-value pairs for each language         |

**How It Works**:

```
HTML: <span data-i18n="text-welcome">Welcome</span>
        ↓ (i18n.ts loads configs/i18n/{lang}.json)
      Replaces textContent with translated value

Rich text: <span data-i18n-html="html-intro">Intro with <cite>Title</cite></span>
        ↓ (updatePageText() rewrites innerHTML from langData, preserving inline markup)

Tooltips: <a data-bs-toggle="tooltip" data-i18n-tooltip="text-foo" data-bs-title="Foo">
        ↓ (updatePageText() rewrites data-bs-title from langData)

Alt text: <img alt="Illustration" data-i18n-alt="text-illustration" src="...">
        ↓ (updatePageText() rewrites alt from langData)

ARIA labels: <a aria-label="Settings" data-i18n-aria-label="text-settings"><i class="bi bi-gear"></i></a>
        ↓ (updatePageText() rewrites aria-label from langData)
```

#### 4.3.1 i18n Key Naming Conventions

- Keys use `dash-case` naming (e.g. `text-welcome`, `html-videos-description`, `text-http-404-description`).
- **Plain text** translations use the `text-` prefix. These keys serve `data-i18n`, `data-i18n-alt`, `data-i18n-tooltip`, and `data-i18n-aria-label` — the same `text-*` key can be reused across different contexts.
- **HTML / rich text** translations use the `html-` prefix. These keys contain HTML markup (e.g. `<cite>`, `<strong>`) and are only used with `data-i18n-html`. The translation string is applied via `innerHTML`.
- For `<img>` alt attributes: use `data-i18n-alt` (e.g. `data-i18n-alt="text-illustration"`).
- For tooltip-only translations: use `data-i18n-tooltip` (e.g. `data-i18n-tooltip="text-settings"`).
- For `aria-label` translations: use `data-i18n-aria-label` (e.g. `data-i18n-aria-label="text-settings"`). The English fallback text must be placed in the `aria-label` attribute directly, with `data-i18n-aria-label` as the companion i18n key attribute after it.
- For translations that contain inline HTML markup (e.g. `<cite>`, `<em>`, `<strong>`): use `data-i18n-html` with an `html-*` key (e.g. `data-i18n-html="html-videos-description"`). Only use this when inline markup is required; prefer `data-i18n` with a `text-*` key for plain text.
- Proper nouns that are identical across all supported languages (e.g. "Pixiv", "GitHub", "QQ") do not need i18n keys - simply use the original text directly in `alt`, `data-bs-title`, or `aria-label` without a `data-i18n-*` attribute. Do not add these to the translation JSON files.

**Configuration**: Translation JSON files are flat key-value objects. Every `text-*` or `html-*` key used in HTML must have a corresponding entry in every language file. The keys should be arranged in alphabetical order.

**Data Flow**:

| Mechanism      | Key              | Purpose                            |
|----------------|------------------|------------------------------------|
| `localStorage` | `preferredLang`  | Persist language preference        |
| Global var     | `currentLang`    | Currently loaded language code     |
| Global var     | `langData`       | Loaded translation key-value pairs |
| Global var     | `supportedLangs` | Array of available language codes  |


