### 4.20 Build-time Minification

**Brief**: After Vite finishes bundling, a `closeBundle` hook walks the `dist/` directory and minifies all HTML, JSON, static CSS/JS, and XML files.

**Related Files**:

| File             | Role                                          |
|------------------|-----------------------------------------------|
| `vite.config.js` | `closeBundle` hook in `injectHeadTags` plugin |

**Dependencies**: `html-minifier-terser` (dev).

**How It Works**:

```
Vite build completes → closeBundle fires
  ↓ walkDir(distDir, ['.html'])
For each .html → minify() with collapseWhitespace, removeComments,
  removeRedundantAttributes, minifyCSS, minifyJS.
  JSON-LD blocks protected via ignoreCustomFragments.
  <noscript> blocks protected via ignoreCustomFragments.
  ↓ walkDir(distDir, ['.json'])
For each .json → JSON.stringify(JSON.parse(...)) (compact single-line).
  ↓ walkDir(distDir, ['.css']).filter(legacy only)
For each legacy .css → regex: strip comments, collapse whitespace.
  (Vite-built CSS bundles are already minified by esbuild — skipped.)
  ↓ walkDir(distDir, ['.js']).filter(legacy only)
For each legacy .js → regex: strip comments, collapse whitespace.
  ↓ walkDir(distDir, ['.xml'])
For each .xml → regex: remove whitespace between tags.
```

**Minification Functions**:

| Function            | Target              | Method                                                      |
|---------------------|---------------------|-------------------------------------------------------------|
| `minifyHTML()`      | `*.html`            | `html-minifier-terser` with JSON-LD/`<noscript>` protection |
| `minifyJSON()`      | `*.json`            | `JSON.stringify` compact output                             |
| `minifyStaticCSS()` | `legacy/*.css` only | Regex: strip comments, collapse whitespace                  |
| `minifyStaticJS()`  | `legacy/*.js` only  | Regex: strip comments, collapse whitespace                  |
| `minifyXML()`       | `*.xml`             | Regex: remove inter-tag whitespace                          |
