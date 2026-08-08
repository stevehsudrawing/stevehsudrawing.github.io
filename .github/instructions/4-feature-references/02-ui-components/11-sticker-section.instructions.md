---
description: >
  StickerSection.vue: reusable footer sticker section with FeatureAwarePicture.
  Derives 4 image paths from a stickerId.  Supports caption text and default slot.
  Used by AboutPage and IndexPage footer stickers.
  Use when: adding new sticker images, modifying sticker layout, or changing
  the shared 150×150 follow-theme pattern.
applyTo: >
  src/components/ui/StickerSection.vue
---

#### 4.2.11 Sticker Section

`StickerSection.vue` renders a 150×150 follow-theme sticker image with an
optional caption and a default slot for custom content.

##### 4.2.11.1 Props

| Prop           | Type      | Notes                                                    |
| -------------- | --------- | -------------------------------------------------------- |
| `stickerId`    | `string`  | Filename stem — derives 4 paths (AVIF/WebP × light/dark) |
| `stickerTitle` | `string`  | Fallback alt text for the sticker image                  |
| `caption`      | `string?` | Optional plain text below the sticker                    |

##### 4.2.11.2 Path Derivation

```
/images/avif/stickers/light/{stickerId}.avif
/images/avif/stickers/dark/{stickerId}.avif
/images/webp/stickers/light/{stickerId}.webp
/images/webp/stickers/dark/{stickerId}.webp
```

Alt text uses i18n key `text-sticker-of-{stickerId}` with `stickerTitle` as fallback.

All stickers share the same visual settings: `feature="follow-theme"`,
`imgClass="no-copy solid-bg"`, width=150, height=150.

##### 4.2.11.3 Default Slot

Placed below the sticker image (after the optional caption). Used by
IndexPage for a `<TypeAwareLink>` to the About page.

##### 4.2.11.4 Usage

```vue
<!-- Simple caption mode (AboutPage) -->
<StickerSection
  sticker-id="thanks"
  :sticker-title="$t('text-sticker-of-thanks', 'Sticker (Thanks)')"
  :caption="$t('text-thanks-for-your-visiting', 'Thanks for your visiting!')"
/>

<!-- Custom slot mode (IndexPage) -->
<StickerSection
  sticker-id="thumb"
  :sticker-title="$t('text-sticker-of-thumb', 'Sticker (Thumb)')"
>
  <TypeAwareLink type="internal" href="/about.html" ...>
    <span>{{ $t(...) }}</span>
    <i class="bi bi-arrow-right"></i>
  </TypeAwareLink>
</StickerSection>
```
