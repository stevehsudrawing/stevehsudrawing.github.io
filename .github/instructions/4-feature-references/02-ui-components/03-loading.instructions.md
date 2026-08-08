---
description: >
  Loading UI: LoadingScreen.vue (#loading-screen static HTML pre-render + fade-out),
  LoadingBar.vue (#loading-bar progress bar for page transitions + language loading).
  Use when: modifying loading indicators, progress bar behavior, or initialization sequence.
applyTo: >
  src/components/ui/LoadingScreen.vue;
  src/components/ui/LoadingBar.vue
---

#### 4.2.3 Loading Screen & Loading Bar

##### 4.2.3.1 LoadingScreen — Static HTML Coexistence

`#loading-screen` is a static `<div>` in each `.html` page's `<body>` that
renders instantly before Vue mounts:

```
HTML page load -> #loading-screen visible
Vue mounts -> LoadingScreen.onMounted
Init complete -> App.vue calls loadingScreenRef.value?.hide()
                -> fade-out animation -> 500 ms -> remove from DOM
```

##### 4.2.3.2 LoadingBar — API

Element: `#loading-bar` + `#loading-bar-fill` (rendered in component template).

| Method       | Behavior                                 |
| ------------ | ---------------------------------------- |
| `show()`     | Reset -> animate width to 85%            |
| `complete()` | Animate to 100% -> fade out after 350 ms |
| `hide()`     | Immediately hide without animation       |

##### 4.2.3.3 LoadingBar — Consumers

| Consumer              | How                                              |
| --------------------- | ------------------------------------------------ |
| `useI18n.setLocale()` | Calls `loadingBarRef` methods directly           |
| `usePageNavigation()` | Via router guards, calls `loadingBarRef` methods |

##### 4.2.3.4 CSS

Both components use non-scoped `<style>` blocks — see CSS Style Block Taxonomy
in `4.VC Vue Component Conventions`.
