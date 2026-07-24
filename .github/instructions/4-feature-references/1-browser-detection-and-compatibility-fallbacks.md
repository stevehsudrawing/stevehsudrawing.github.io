### 4.1 Browser Detection & Compatibility Fallbacks

**Brief**: Uses feature detection (testing optional chaining support via `new Function()`) to verify the browser meets the minimum baseline, and redirects to `error-unsupported-browser.html` if not. Verifies that Bootstrap CSS loaded correctly. Also handles the case where JavaScript is disabled by redirecting to `error-javascript-disabled.html`. Known search engine bots, crawlers, and SEO tools are whitelisted via `isBotOrCrawler()` by UA matching to prevent SEO-impacting false negatives (see [§4.16.8](16-seo.md#4168-crawler-whitelist)).

**Related Files**:

| File                                  | Role                                                                                               |
|---------------------------------------|----------------------------------------------------------------------------------------------------|
| `public/legacy/env-detection.js`      | Runs before page load; performs basic environment checks, feature detection, and crawler whitelist |
| `src/core/bootstrap-css-detection.ts` | Verifies Bootstrap CSS loaded successfully                                                         |
| `error-unsupported-browser.html`      | Fallback page for unsupported browsers                                                             |
| `error-javascript-disabled.html`      | Fallback page displayed when JavaScript is disabled                                                |

> `env-detection.js` is executed first among all scripts. It uses `new Function()` to test ES2020 syntax support without causing a SyntaxError on older engines. Written in ES5 for broad compatibility.

**Data Flow**:

- `env-detection.js` first checks via `isBotOrCrawler()` whether the User-Agent belongs to a known crawler; if so, the browser is always treated as supported (see [§4.16.8](16-seo.md#4168-crawler-whitelist)).
- For real users, `isFeatureSupported()` tests whether the JS engine can parse optional chaining syntax via `new Function('return 0?.x')`. If the test throws a SyntaxError, the browser is considered unsupported.
- If unsupported: redirects to `error-unsupported-browser.html`.
- `bootstrap-css-detection.ts` checks that Bootstrap CSS is applied; shows a warning if not.

**JavaScript Disabled Fallback**:

- Every full-functionality page and `404.html` includes a `<noscript>` meta-refresh in `<head>`:

    ```html
    <noscript>
        <meta http-equiv="refresh" content="0;url=/error-javascript-disabled.html">
    </noscript>
    ```

- This redirect happens before any external resources are loaded, ensuring the fallback page is shown even when CDN scripts are unavailable.
