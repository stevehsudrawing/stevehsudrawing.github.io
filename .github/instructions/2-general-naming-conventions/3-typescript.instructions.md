---
description: >
  TypeScript naming conventions: camelCase variables/functions, SCREAMING_SNAKE_CASE constants,
  PascalCase interfaces/types/enums. Import conventions (.js extensions, import type, Direct Import
  Principle). Function naming prefixes (init/dispose/create/remove/add/mark/handle/load/update/apply/
  get/set/populate/generate/hide/extract/normalize). Batch functions must delegate to single-element
  functions; single-element functions must have symmetric counterparts (add/remove, init/dispose,
  create/remove). Use when: writing or refactoring TypeScript code.
applyTo: >
  build/**/*.ts;
  src/**/*.ts
---

### 2.3 TypeScript

| Category               | Convention             | Examples                                     |
| ---------------------- | ---------------------- | -------------------------------------------- |
| Variables              | `camelCase`            | `currentLang`, `supportedLangs`, `langData`  |
| Functions              | `camelCase`            | `loadAllComponents`, `updatePageText`        |
| Constants (top-level)  | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES`, `EXCLUDED_PAGES`           |
| Constants (`as const`) | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES = [...] as const`            |
| `const enum`           | `PascalCase`           | `StorageKey`, `AppEvent`                     |
| DOM element refs       | `camelCase`            | `htmlElement`, `prefersColorScheme`          |
| Interfaces             | `PascalCase`           | `HastProperties`, `LanguageItem`, `CardData` |
| Type aliases           | `PascalCase`           | `Lang`, `ThemeChoice` (string literals)      |

#### 2.3.1 Import Conventions

- All import paths must use **`.js` extensions** (not `.ts`), even when importing from TypeScript files. Vite's `moduleResolution: "bundler"` resolves `.js` -> `.ts` automatically, but TypeScript 7 rejects `.ts` extensions unless `allowImportingTsExtensions` is enabled (which is not supported by Vite's esbuild).
- Import shared types from `../types/` using `import type` for type-only imports to ensure they are erased at build time.

  ```ts
  // Correct
  import type { Lang, ThemeChoice } from "../types/app.js";
  import { StorageKey, AppEvent } from "../types/app.js";

  // Wrong - .ts extension rejected by tsc
  import { StorageKey } from "../types/app.ts";
  ```

- **Direct Import Principle**: When using an export variable, function, or other object from a module as needed, import it **directly** from the source module, rather than passing it indirectly.
  - Correct:

  ```ts
  // In src/core/module-a.ts:
  export function doSomething(): void {
    /* ... */
  }

  // In src/feature/module-c.ts:
  import { doSomething } from "../core/module-a.js";
  ```

  - Wrong:

  ```ts
  // In src/core/module-a.ts:
  export function doSomething(): void {
    /* ... */
  }

  // In src/ui/module-b.ts:
  import { doSomething } from "../core/module-a.js";
  export { doSomething };

  // In src/feature/module-c.ts:
  import { doSomething } from "../ui/module-b.js";
  ```

#### 2.3.2 Function Naming by Category

| Prefix       | Purpose                            | Examples                                                                                            |
| ------------ | ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `init*`      | Initialize / set up listeners      | `initThemePreference`, `initSkipButton`, `initAllTooltips`, `initAllScrollHints`, `initPageContent` |
| `dispose*`   | Tear down / remove listeners       | `disposeTooltip`, `disposeCopyLinkTooltip`, `disposeAllTooltips`                                    |
| `create*`    | Create and inject a DOM element    | `createTooltip`, `createScrollHint`                                                                 |
| `remove*`    | Remove a DOM element or attribute  | `removeScrollHint`, `removeExternalLinkIndicator`, `removeExternalLinkTargetBehavior`               |
| `add*`       | Add a DOM element or attribute     | `addExternalLinkIndicator`, `addExternalLinkTargetBehavior`                                         |
| `mark*`      | Set or clear a visual state marker | `markImageLoaded`, `markImageUnloaded`                                                              |
| `handle*`    | DOM event handler (named function) | `handleCopyLinkClick`, `handleTitleLinkAnchorClick`                                                 |
| `load*`      | Async data fetching                | `loadSupportedLangs`, `loadLang`, `loadAllComponents`, `loadHTML`                                   |
| `update*`    | Update existing DOM content        | `updatePageText`, `updatePageTitle`, `updateThemeToggleText`                                        |
| `apply*`     | Apply a setting / style change     | `applyThemePreference`, `applyAllThemeBasedImages`, `applyAllExternalLinkTargetBehavior`            |
| `get*`       | Retrieve / compute a value         | `getSystemTheme`                                                                                    |
| `set*`       | Set a state / attribute            | `setActiveNavItem`, `setActiveLangItem`, `setActiveThemeItem`                                       |
| `populate*`  | Fill UI lists / menus              | `populateLanguageMenus`                                                                             |
| `generate*`  | Create and inject DOM elements     | `generateLinkCards`                                                                                 |
| `hide*`      | Hide an element                    | `hideLoadingBar`                                                                                    |
| `extract*`   | Parse / derive from input          | `extractPageName`                                                                                   |
| `normalize*` | Normalize / sanitize input         | `normalizeInternalPath`                                                                             |

> Prefer existing prefixes when adding new functions. If none fit, use a clear descriptive verb.

#### 2.3.3 Batch Functions Must Delegate to Single-Element Functions

A **batch function** is a function that queries multiple DOM elements and applies the same operation to each one. The per-element logic **must** be extracted into a reusable single-element function. The batch function then delegates to it.

- Batch function names **must** include `All` before the noun (e.g. `initAllTooltips()`, `applyAllThemeBasedImages()`).
- The corresponding single-element function describes the per-element action (e.g. `createTooltip(el)`, `applyThemeBasedImage(img)`).
- The single-element function should be **idempotent** (safe to call multiple times on the same element).
- Functions without a corresponding single-element function (pure event delegation, singleton initialization, etc.) do not need `All` in their name.

#### 2.3.4 Single-Element Functions Must Have Symmetric Counterparts

Every single-element function that **adds, creates, or initializes** something on a DOM element **must** have a corresponding single-element function that **removes, destroys, or cleans up** the same thing. This ensures that:

- Other modules can cleanly reverse an operation without inlining DOM manipulation logic.
- `removeEventListener` can precisely target the handler (requires a named `handle*` function, not an anonymous closure).
- The API surface is predictable: if there is an "on" path, there is an "off" path.

**Naming conventions for symmetric pairs:**

| Operation          | Add / Create / Init            | Remove / Destroy / Cleanup        |
| ------------------ | ------------------------------ | --------------------------------- |
| DOM element        | `create*` / `add*`             | `remove*`                         |
| Event listener     | `init*` (with named `handle*`) | `dispose*`                        |
| Visual state       | `mark*Loaded` / `mark*Active`  | `mark*Unloaded` / `mark*Inactive` |
| Bootstrap instance | `createTooltip`                | `disposeTooltip`                  |

**Existing symmetric single-element pairs:**

| Add / Create / Init                   | Remove / Destroy / Cleanup               | Module             |
| ------------------------------------- | ---------------------------------------- | ------------------ |
| `createTooltip(el)`                   | `disposeTooltip(el)`                     | `tooltips.ts`      |
| `initCopyLinkTooltip(link)`           | `disposeCopyLinkTooltip(link)`           | `tooltips.ts`      |
| `markImageLoaded(img)`                | `markImageUnloaded(img)`                 | `img-utils.ts`     |
| `addExternalLinkIndicator(link)`      | `removeExternalLinkIndicator(link)`      | `accessibility.ts` |
| `initTitleLinkAnchor(anchor)`         | `disposeTitleLinkAnchor(anchor)`         | `accessibility.ts` |
| `createScrollHint(group)`             | `removeScrollHint(group)`                | `scroll-hint.ts`   |
| `addExternalLinkTargetBehavior(link)` | `removeExternalLinkTargetBehavior(link)` | `settings.ts`      |

**Handler extraction rule:** If an `init*` function uses `addEventListener` with an anonymous function, the handler **must** be extracted as a named `handle*` function so the corresponding `dispose*` function can call `removeEventListener` with the same reference.

Existing batch / single-element pairs:

| Batch Function                         | Single-Element Function               | Module             |
| -------------------------------------- | ------------------------------------- | ------------------ |
| `initAllTooltips()`                    | `createTooltip(el)`                   | `tooltips.ts`      |
| `disposeAllTooltips()`                 | `disposeTooltip(el)`                  | `tooltips.ts`      |
| `initAllCopyLinkTooltips()`            | `initCopyLinkTooltip(link)`           | `tooltips.ts`      |
| `initAllColoredImages()`               | `applyColoredImage(img)`              | `img-utils.ts`     |
| `initAllImageLoadingOpacity()`         | `initImageLoadingOpacity(img)`        | `img-utils.ts`     |
| `applyAllThemeBasedImages()`           | `applyThemeBasedImage(img)`           | `theme.ts`         |
| `applyAllFaviconThemes()`              | `applyFaviconTheme(link)`             | `theme.ts`         |
| `addAllExternalLinkIndicators()`       | `addExternalLinkIndicator(link)`      | `accessibility.ts` |
| `initAllTitleLinkAnchors()`            | `initTitleLinkAnchor(anchor)`         | `accessibility.ts` |
| `initAllScrollHints()`                 | `createScrollHint(group)`             | `scroll-hint.ts`   |
| `applyAllExternalLinkTargetBehavior()` | `addExternalLinkTargetBehavior(link)` | `settings.ts`      |
| `initAllScrollHints()`                 | `createScrollHint(group)`             | `scroll-hint.ts`   |

#### 2.3.5 TSDoc Requirement

Every exported variable, function, interface, and type alias **must** have a standard TSDoc comment (`/** ... */`) that describes its purpose, parameters, and return value.

```ts
// Correct
/**
 * Initializes all Bootstrap tooltips on the page.
 * Delegates to {@link createTooltip} for each element.
 * @returns {void}
 */
export function initAllTooltips(): void {
  /* ... */
}

// Wrong - missing TSDoc
export function initAllTooltips(): void {
  /* ... */
}
```

#### 2.3.6 Vue-Specific Naming

| Context              | Convention     | Examples                                               |
| -------------------- | -------------- | ------------------------------------------------------ |
| `.vue` files         | `PascalCase`   | `AppNavbar.vue`, `SettingsModal.vue`, `ToastStack.vue` |
| Composable files     | `useXxx.ts`    | `useI18n.ts`, `useTheme.ts`, `useLocalStorage.ts`      |
| Composable functions | `useXxx()`     | `useI18n()`, `useTheme()`, `useLocalStorage()`         |
| Vue plugin files     | `camelCase.ts` | `i18n.ts`                                              |
