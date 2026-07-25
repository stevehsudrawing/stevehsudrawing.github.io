### 4.11 Fonts & Typography

**Brief**: Defines comprehensive font stacks for body text, headings, monospace code, and emoji across all supported languages. The actual font stacks are assembled in `stylesheets/fonts.css` using `--shlh-font-*` CSS custom properties.

**Related Files**:

| File                        | Role                                                                     |
|-----------------------------|--------------------------------------------------------------------------|
| `src/stylesheets/fonts.css` | Font-face declarations and per-element, per-language font stack assembly |

#### 4.11.1 Font Variable Naming

Font-related CSS custom properties use the `--shlh-*` prefix with the following pattern:

`--shlh-font-{category}-{priority}-{language}`

- **Category**:
    - `sans-serif-text` - body
    - `sans-serif-display` - headings
    - `monospace` - code
- **Priority**:
    - `major` - Preferred fonts, listed first in the stack
    - `fallback` - Secondary fallback fonts, arranged as needed
    - `system`  - OS-level generic family, e.g. `ui-monospace`, `-apple-system`
- **Language**:
    - `en` - English / Latin
    - `ja` - Japanese / CJK Compatible
    - `zh-Hans`,`zh-Hant`, etc.

**Full examples**:
- `--shlh-font-sans-serif-text-major-en`: preferred body font stack for English / Latin
- `--shlh-font-monospace-fallback-zh-Hans`: fallback monospace stack for Simplified Chinese

**Special Variables**:
- `--shlh-font-{category}-system`: System fallback. Such variables are considered language-independent.
- `--shlh-font-emoji`: Emoji font stack. Emoji is considered unrelated to all three of the above entries.

Font stacks are assembled per-element (body, h1, code) and per-lang (`html[lang='zh-Hans']`, etc.) in `src/stylesheets/fonts.css`. See that file for the exact composition of each stack.

See [§2.2.1](../2-general-naming-conventions/2-css-custom-properties.md#221-project-specific) for the overall `--shlh-*` prefix definition.

#### 4.11.2 Font Stack Design

- **Font arrangement constraint**: If a font has a localized name, the localized name is placed first, followed by the general Western name.
- The detailed per-language, per-platform font preference tables below define the canonical font lists. The actual CSS in `fonts.css` is the authoritative source.

<details>
<summary><code>sans-serif-text-major</code> (body text preferred fonts)</summary>

| Language  | Preferred                                                         | Apple                                                                     | Chromium / Android / Linux                                                               | Windows                                                     |
|-----------|-------------------------------------------------------------------|---------------------------------------------------------------------------|------------------------------------------------------------------------------------------|-------------------------------------------------------------|
| `en`      | `Inter Variable`, `Inter Variable Text`, `InterVariable`, `Inter` | `SF Pro`, `SF Pro Text`, `SF Text`, `San Francisco Text`, `San Francisco` | `Roboto Flex`, `Roboto`, `Noto Sans`                                                     | `Segoe UI Variable Text`, `Segoe UI`                        |
| `ja`      | `更紗ゴシック J`, `Sarasa Gothic J`                               | `ヒラギノ角ゴシック`, `Hiragino Sans`                                     | `Noto Sans JP`, `Noto Sans CJK JP`, `Noto Sans CJK`, `源ノ角ゴシック`, `Source Han Sans` | `Meiryo UI`, `メイリオ`, `Meiryo`                           |
| `zh-Hans` | `更纱黑体 SC`, `Sarasa Gothic SC`                                 | `苹方-简`, `PingFang SC`, `苹方`, `PingFang`                              | `Noto Sans SC`, `Noto Sans CJK SC`, `思源黑体`, `Source Han Sans SC`                     | `Microsoft YaHei UI`, `微软雅黑`, `Microsoft YaHei`         |
| `zh-Hant` | `更紗黑體 TC`, `Sarasa Gothic TC`                                 | `蘋方-繁`, `PingFang TC`, `蘋方`, `PingFang`                              | `Noto Sans TC`, `Noto Sans CJK TC`, `思源黑體`, `Source Han Sans TC`                     | `Microsoft JhengHei UI`, `微軟正黑體`, `Microsoft JhengHei` |

</details>

<details>
<summary><code>sans-serif-text-fallback</code> (body text fallback fonts)</summary>

| Language  | Apple                                                                      | Android / Linux                                                                                                                                  | Windows / General                                   |
|-----------|----------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| `en`      | `Helvetica Neue`, `Helvetica`                                              | `Liberation Sans`, `DejaVu Sans`, `Droid Sans`                                                                                                   | `Tahoma`, `Geneva`, `Verdana`, `Arial`              |
| `ja`      | `Osaka`                                                                    | `VL Ｐゴシック`, `VL PGothic`, `IPA ゴシック`, `IPA Gothic`, `さざなみゴシック`, `Sazanami Gothic`, `Droid Sans Japanese`, `Droid Sans Fallback` | `ＭＳ Ｐゴシック`, `MS PGothic`, `Arial Unicode MS` |
| `zh-Hans` | `华文细黑`, `STXihei`, `华文黑体`, `STHeiti`, `黑体-简`, `Heiti SC`, `Hei` | `文泉驿微米黑`, `WenQuanYi Micro Hei`, `文泉驿正黑`, `WenQuanYi Zen Hei`, `Droid Sans Fallback`                                                  | `黑体`, `SimHei`, `宋体`, `SimSun`                  |
| `zh-Hant` | `儷黑 Pro`, `LiHei Pro`, `蘋果儷中黑`, `Apple LiGothic`                    | `文泉驛微米黑`, `WenQuanYi Micro Hei`, `文泉驛正黑`, `WenQuanYi Zen Hei`, `Droid Sans Fallback`                                                  | `新細明體`, `PMingLiU`                              |

</details>

<details>
<summary><code>monospace-major</code> (code preferred fonts)</summary>

| Language  | Preferred                             | Apple                           | Chromium / Android / Linux                                | Windows                          |
|-----------|---------------------------------------|---------------------------------|-----------------------------------------------------------|----------------------------------|
| `en`      | `Roboto Mono Variable`                | `SF Mono`, `San Francisco Mono` | `Noto Sans Mono`                                          | `Cascadia Code`, `Cascadia Mono` |
| `ja`      | `更紗等幅ゴシック J`, `Sarasa Mono J` | -                               | `Noto Sans Mono CJK JP`, `源ノ等幅`, `Source Han Mono`    | -                                |
| `zh-Hans` | `等距更纱黑体 SC`, `Sarasa Mono SC`   | -                               | `Noto Sans Mono CJK SC`, `思源等宽`, `Source Han Mono SC` | -                                |
| `zh-Hant` | `等距更紗黑體 TC`, `Sarasa Mono TC`   | -                               | `Noto Sans Mono CJK TC`, `思源等寬`, `Source Han Mono TC` | -                                |

</details>

<details>
<summary><code>monospace-fallback</code> (code fallback fonts)</summary>

| Language  | Apple             | Android / Linux                                                                                 | Windows / General                                      |
|-----------|-------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| `en`      | `Menlo`, `Monaco` | `DejaVu Sans Mono`, `Liberation Mono`, `Droid Sans Mono`, `FreeMono`                            | `Consolas`, `Lucida Console`, `Courier New`, `Courier` |
| `ja`      | `Osaka`           | `VL ゴシック`, `VL Gothic`, `IPA ゴシック`, `IPA Gothic`, `さざなみゴシック`, `Sazanami Gothic` | `ＭＳ ゴシック`, `MS Gothic`                           |
| `zh-Hans` | -                 | `文泉驿等宽微米黑`, `WenQuanYi Micro Hei Mono`, `文泉驿等宽正黑`, `WenQuanYi Zen Hei Mono`      | `黑体`, `SimHei`, `新宋体`, `NSimSun`                  |
| `zh-Hant` | -                 | `文泉驛等寬微米黑`, `WenQuanYi Micro Hei Mono`, `文泉驛等寬正黑`, `WenQuanYi Zen Hei Mono`      | `細明體`, `MingLiU`                                    |

</details>

<details>
<summary><code>sans-serif-display</code> (<code>en</code> only, for headings)</summary>

- Preferred: `Inter Display`, `InterDisplay`, `Inter Variable`, `InterVariable`
- Apple: `SF Pro Display`, `SF Display`, `San Francisco Display`, `SF Pro`
- Chromium / Android / Linux: `Google Sans Flex`, `Roboto Flex`
- Windows: `Segoe UI Variable Display`

</details>

<details>
<summary><code>emoji</code> (language-agnostic)</summary>

- Apple: `Apple Color Emoji`
- Android / Linux: `Noto Color Emoji`
- Windows: `Segoe UI Emoji`, `Segoe UI Symbol`

</details>


