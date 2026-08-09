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
--shlh-font-{category}-{language}
```

| Token    | Values                                                                  |
| -------- | ----------------------------------------------------------------------- |
| category | `sans-serif-text` / `sans-serif-display` / `monospace` / `emoji`        |
| language | `en` (Latin) / `ja` (CJK Compatible) / `zh-Hans` / `zh-Hant` / `system` |

##### 4.1.4.2 Font Stacks

Font stacks are assembled from individual `--shlh-font-*` variables to produce
per-platform per-language preferences. Each ordered list below reflects the
actual `font-family` fallback order in `fonts.css`.

- **`sans-serif-text`** — body copy:
  - English / Latin:
    1. Website-preferred: Inter (variable)
    2. Apple: SF Pro
    3. Cross-platform: Roboto
    4. Windows: Segoe UI
  - Japanese / CJK Compatible:
    1. Website-preferred: Sarasa Gothic
    2. Apple: Hiragino Sans
    3. Cross-platform: Noto Sans JP / Noto Sans CJK JP / Noto Sans CJK / Source Han Sans
    4. Windows: Meiryo
  - Chinese (`zh-Hans`):
    1. Website-preferred: Sarasa Gothic SC
    2. Apple: PingFang SC
    3. Cross-platform: Noto Sans SC / Noto Sans CJK SC / Source Han Sans SC
    4. Windows: Microsoft YaHei
  - Chinese (`zh-Hant`):
    1. Website-preferred: Sarasa Gothic TC
    2. Apple: PingFang TC
    3. Cross-platform: Noto Sans TC / Noto Sans CJK TC / Source Han Sans TC
    4. Windows: Microsoft JhengHei
  - `system`: `-apple-system, ui-sans-serif, system-ui, sans-serif`

- **`sans-serif-display`** — headings (h1, h2):
  - English / Latin:
    1. Website-preferred: Inter Display
    2. Apple: SF Pro Display
    3. Cross-platform: Roboto Flex
    4. Windows: Segoe UI Variable Display
  - Japanese / CJK Compatible — **no display variant exists; falls through to `sans-serif-text` stack.**
  - Chinese — **no display variant exists; falls through to `sans-serif-text` stack.**

- **`monospace`** — code blocks / inline code:
  - English / Latin:
    1. Website-preferred: Roboto Mono (variable)
    2. Apple: SF Mono
    3. Cross-platform: Noto Sans Mono
    4. Windows: Cascadia Code / Cascadia Mono
  - Japanese / CJK Compatible:
    1. Website-preferred: Sarasa Mono J
    2. Cross-platform: Noto Sans Mono CJK JP / Source Han Mono
  - Chinese (`zh-Hans`):
    1. Website-preferred: Sarasa Mono SC
    2. Cross-platform: Noto Sans Mono CJK SC / Source Han Mono SC
  - Chinese (`zh-Hant`):
    1. Website-preferred: Sarasa Mono TC
    2. Cross-platform: Noto Sans Mono CJK TC / Source Han Mono TC
  - `system`: `ui-monospace, monospace`

- **`emoji`** — language-agnostic:
  1. Apple: Apple Color Emoji
  2. Cross-platform: Noto Color Emoji
  3. Windows: Segoe UI Emoji / Segoe UI Symbol

##### 4.1.4.3 @font-face

Self-hosted via `@fontsource-variable/inter` and `@fontsource-variable/roboto-mono`
npm packages. CSS imports are in `src/main.ts`.
