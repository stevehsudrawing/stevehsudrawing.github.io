---
description: >
  TypeScript naming conventions: camelCase variables/functions, SCREAMING_SNAKE_CASE constants,
  PascalCase interfaces/types/enums. Import conventions (no .ts suffix, import type, Direct Import
  Principle). Legacy DOM-function prefixes (init/dispose/create/remove/add/mark/handle/update/apply/
  get/set/extract/normalize) for src/ui/. Vue-specific naming for components/composables/plugins.
  Use when: writing or refactoring TypeScript code.
applyTo: >
  build/**/*.ts;
  src/**/*.ts
---

### 2.3 TypeScript Naming Conventions

---

#### 2.3.1 General Rules (all TypeScript)

**The principle of "high cohesion and low coupling"**

A function should perform only one task to ensure it can be reused.

**Naming table:**

| Category               | Convention             | Examples                                                  |
| ---------------------- | ---------------------- | --------------------------------------------------------- |
| Variables              | `camelCase`            | `currentLang`, `isPlaying`                                |
| Functions              | `camelCase`            | `scrollToHashTarget`, `useI18n`                           |
| Constants (top-level)  | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES`, `EXCLUDED_PAGES`                        |
| Constants (`as const`) | `SCREAMING_SNAKE_CASE` | `INTERNAL_PAGES = [...] as const`                         |
| `const enum`           | `PascalCase`           | `StorageKey`, `AppEvent`                                  |
| DOM element refs       | `camelCase`            | `htmlElement`, `carouselRef`                              |
| Interfaces             | `PascalCase`           | `HeroImageProps`, `CardData`, `LinkButtonGroupData`       |
| Type aliases           | `PascalCase`           | `Lang`, `ThemeChoice`, `EffectiveTheme` (string literals) |

**Import conventions:**

- **No extension**: `import { foo } from '../core/bar'` (not `../core/bar.ts` or `../core/bar.js`).
- **`import type`** for type-only imports (erased at build time):

  ```ts
  // Correct
  import type { Lang, ThemeChoice } from "../types/app";
  import { StorageKey, AppEvent } from "../types/app";
  ```

- **Direct Import Principle**: import directly from the source module; do not re-export through intermediate modules.

  ```ts
  // Correct
  // In src/feature/module-c.ts:
  import { doSomething } from "../core/module-a";

  // Wrong — unnecessary re-export
  // In src/ui/module-b.ts:
  import { doSomething } from "../core/module-a";
  export { doSomething };
  // In src/feature/module-c.ts:
  import { doSomething } from "../ui/module-b";
  ```

**TSDoc requirement:**

Every exported variable, function, interface, and type alias **must** have a standard TSDoc comment (`/** ... */`).

```ts
// Correct
/**
 * Smooth-scroll the page to an element identified by a hash fragment.
 * @param hash - The hash fragment (with or without leading '#').
 * @param instant - If true, scroll instantly instead of smoothly.
 * @param offset - Offset from the top of the viewport, in px.
 */
export function scrollToHashTarget(
  hash: string,
  instant = false,
  offset: number = 72,
): void {
  /* ... */
}

// Wrong — missing TSDoc
export function scrollToHashTarget(hash: string): void {
  /* ... */
}
```

---

#### 2.3.2 Legacy-Specific Rules (imperative DOM — `src/ui/`)

> **Diminishing.** These rules apply to the legacy imperative modules under
> `src/ui/`. New code should use Vue components or composables instead
> (see §2.3.3). As the codebase migrates, the examples below are
> kept current with what still exists.

**Function naming prefixes:**

| Prefix       | Purpose                           | Examples (current)                                                               |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------- |
| `init*`      | Initialize / set up listeners     | `initInputModalityDetection`, `initThemePreference`, `initBootstrapCSSDetection` |
| `update*`    | Update DOM content or state       | `updatePageTitle`, `updateThemeToggleText`, `updateAutoThemeOnSystemChange`      |
| `apply*`     | Apply a setting / style change    | `applyThemePreference`, `applyThemeChange`, `applyAllThemeBasedImages`           |
| `add*`       | Add a DOM element or attribute    | `addExternalLinkIndicator`, `addAllExternalLinkIndicators`                       |
| `remove*`    | Remove a DOM element or attribute | `removeExternalLinkIndicator`                                                    |
| `mark*`      | Set / clear a visual state marker | `markImageLoaded`, `markImageUnloaded`                                           |
| `set*`       | Set a state / attribute           | `setActiveThemeItem`                                                             |
| `extract*`   | Parse / derive from input         | `extractPageName`                                                                |
| `normalize*` | Normalize / sanitize input        | `normalizeInternalPath`, `normalizeLang`                                         |
| `get*`       | Retrieve / compute a value        | (none remaining — replaced by composables)                                       |

> Prefer existing prefixes. If none fit, use a clear descriptive verb.
> The prefixes `dispose*`, `create*`, `handle*`, `load*`, `populate*`,
> `generate*`, and `hide*` no longer have any active examples —
> their use cases are now served by Vue's `onUnmounted`, component
> templates, composables, and `v-if` directives.

**Batch functions must delegate to single-element functions:**

A **batch function** queries multiple DOM elements and applies the same
operation to each one. The per-element logic **must** be extracted into
a reusable, idempotent single-element function.

- Batch names **must** include `All` before the noun: `applyAllThemeBasedImages()`.
- Functions without a corresponding single-element function (singleton
  initializers, pure event delegation) do **not** need `All`.

**Current batch / single-element pairs:**

| Batch Function                   | Single-Element Function          | Module              |
| -------------------------------- | -------------------------------- | ------------------- |
| `initAllColoredImages()`         | `applyColoredImage(img)`         | `useImgFeatures.ts` |
| `addAllExternalLinkIndicators()` | `addExternalLinkIndicator(link)` | `accessibility.ts`  |
| `applyAllThemeBasedImages()`     | `applyThemeBasedImage(img)`      | `theme.ts`          |
| `applyAllFaviconThemes()`        | `applyFaviconTheme(link)`        | `theme.ts`          |
| `applyAllThemeBasedSources()`    | `applyThemeBasedSource(source)`  | `theme.ts`          |

**Single-element functions must have symmetric counterparts:**

Every single-element function that **adds or creates** something on a
DOM element **must** have a corresponding function that **removes or
cleans up** the same thing.

| Operation        | Add / Create / Init            | Remove / Destroy / Cleanup |
| ---------------- | ------------------------------ | -------------------------- |
| DOM element/attr | `add*`                         | `remove*`                  |
| Visual state     | `mark*Loaded`                  | `mark*Unloaded`            |
| Event listener   | `init*` (with named `handle*`) | `dispose*`                 |

**Current symmetric single-element pairs:**

| Add / Create / Init              | Remove / Cleanup                    | Module              |
| -------------------------------- | ----------------------------------- | ------------------- |
| `addExternalLinkIndicator(link)` | `removeExternalLinkIndicator(link)` | `accessibility.ts`  |
| `markImageLoaded(img)`           | `markImageUnloaded(img)`            | `useImgFeatures.ts` |

**Handler extraction rule:** If an `init*` function uses `addEventListener`
with an anonymous function, the handler **must** be extracted as a named
`handle*` function so the corresponding `dispose*` function can call
`removeEventListener` with the same reference.

---

#### 2.3.3 Vue-Specific Rules (components, composables, plugins)

**Component naming:**

| Context      | Convention   | Examples                                                 |
| ------------ | ------------ | -------------------------------------------------------- |
| `.vue` files | `PascalCase` | `AppNavbar.vue`, `HeroSection.vue`, `SettingsModal.vue`  |
| Composables  | `useXxx`     | `useI18n.ts` / `useI18n()`, `useTheme.ts` / `useTheme()` |
| Vue plugins  | `camelCase`  | `i18n.ts` (exported as `i18nPlugin`)                     |

**`<script setup>` section order** (see [§3.4.5](../../../3-project-structural-constraints/4-vue-component-conventions.instructions.md#345-script-setup-langts-section-conventions)):

```
Types -> Props -> State -> Actions -> Expose
```

Sections use `// ====...==== Name` banners; sub-sections use `// ----...---- Name`.

**Vue lifecycle replaces legacy prefixes:**

| Legacy pattern (`src/ui/`)          | Vue equivalent                    |
| ----------------------------------- | --------------------------------- |
| `init*()` -> `onMounted()`          | Setup in `<script setup>`         |
| `dispose*()` -> `onUnmounted()`     | Automatic cleanup                 |
| `create*()` / `remove*()`           | `v-if` / `v-show` / `<component>` |
| `update*()`                         | `watch()` or computed             |
| DOM query + imperative manipulation | `ref` + template binding          |
| Event delegation on `document`      | `@click` / `@keydown` in template |

For detailed Vue component conventions (CSS style blocks, bridge pattern,
static HTML coexistence), see [§3.4](../../../3-project-structural-constraints/4-vue-component-conventions.instructions.md).
