### 4.14 SVG Injection

**Brief**: Replaces `<span>` placeholders with inline SVG fetched from files at runtime, avoiding hardcoded SVG markup in HTML. Supports dynamic dimension and color control via data attributes.

**Related Files**:

| File                    | Role                                                                |
|-------------------------|---------------------------------------------------------------------|
| `src/core/svg-utils.ts` | `initSvgInjection()` — fetches SVG files and injects as inline DOM |
| `public/images/svg/`    | SVG source files (e.g. `steve-hsu.svg`)                             |

**How It Works**:

```
HTML: <span data-role="svg" data-src="/images/svg/icons/steve-hsu.svg" data-width="32" data-height="28" data-color-var="bs-link-color"></span>
        ↓ (svg-utils.ts at init time)
      Fetch /images/svg/icons/steve-hsu.svg → replace fill="currentColor" with var(--bs-link-color)
        ↓
      Set width/height on <svg>, inject as innerHTML
```

**Attributes**:

| Attribute         | Role                                                    | Example                  |
|-------------------|---------------------------------------------------------|--------------------------|
| `data-role="svg"` | Declares this element as an SVG placeholder             | -                        |
| `data-src`        | Path to the SVG file                                    | `/images/svg/logo.svg`   |
| `data-width`      | SVG width (default unit: px)                            | `32`                     |
| `data-height`     | SVG height (default unit: px)                           | `28`                     |
| `data-color-var`  | CSS variable name (without `--`) for `fill` replacement | `bs-link-color`          |

**SVG File Convention**:

- Use `fill="currentColor"` as a placeholder in the SVG file; it will be replaced at injection time.
- Do not hardcode `width`/`height` in the SVG file; they are set via `data-width`/`data-height`.
- Always include a `viewBox` attribute for proper scaling.


