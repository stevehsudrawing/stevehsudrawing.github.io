---
description: >
  Fonts & typography: comprehensive font stacks via --shlh-font-* CSS custom properties,
  per-language per-platform font preferences (Inter, SF Pro, Roboto, Segoe UI, CJK fonts),
  variable font naming convention.  Use when: modifying fonts.css or font stacks.
applyTo: >
  src/stylesheets/global/fonts.css
---

#### 4.1.4 Fonts & Typography

##### 4.1.4.1 Font Variable Naming

```
--shlh-font-{category}-{priority}-{language}
```

| Token    | Values                                                           |
| -------- | ---------------------------------------------------------------- |
| category | `sans-serif-text` / `sans-serif-display` / `monospace` / `emoji` |
| priority | `major` (primary) / `minor` (fallback)                           |
| language | `en` / `zh-Hans` / `zh-Hant`                                     |

##### 4.1.4.2 Font Stacks

Font stacks are assembled from individual variables to produce per-platform
per-language preferences:

- **English text**: Inter → SF Pro → Roboto → Segoe UI → system-ui
- **CJK text**: Sarasa Gothic → Hiragino Sans → PingFang → Noto Sans CJK
- **Monospace**: Roboto Mono → SF Mono → Consolas → monospace

##### 4.1.4.3 @font-face

Self-hosted via `@fontsource-variable/inter` and `@fontsource-variable/roboto-mono`
npm packages. CSS imports are in `src/main.ts`.
