---
description: >
  Picture Viewer: PictureViewerModal.vue (lightbox) + useHorizontalSwipe.ts
  (touch swipe).  Responsive chrome: tablet/desktop Wikipedia-style 64 px
  bottom bar; mobile iOS Photos-style 64 px top + bottom bars.  Deep link
  ?preview=<id> coordinated by GalleryPage.  Preview-only (.no-copy, no
  download).  Use when: modifying the lightbox, picture navigation, or the
  ?preview= deep-link flow.
applyTo: >
  src/components/modals/PictureViewerModal.vue;
  src/composables/useHorizontalSwipe.ts;
  src/pages/GalleryPage.vue;
  src/components/cards/PictureCard.vue
---

#### 4.3.3 Picture Viewer (Lightbox)

##### 4.3.3.1 Architecture

```
GalleryPage.vue (owns ?preview= deep link + modal stack)
  ├─ watch route.query.preview + groups → push { id: "picture-viewer",
  │    props: { contents, currentId } }
  ├─ PictureCard @select → openViewer + router.replace(?preview=)
  └─ watch viewerOpen (stack) → strip ?preview= on close

PictureViewerModal.vue
  ├─ useStackModal("picture-viewer") → visible + props
  ├─ contents + currentId → internal index (prev/next)
  ├─ Chrome: bottom bar (desktop) / top+bottom bars (mobile), via useBreakpoint
  ├─ QR share: QRCodeButton → qr-code modal (current deep link, hideOpenLink)
  ├─ Related link: TypeAwareLink (internal)
  └─ useHorizontalSwipe(stageRef, { onLeft, onRight }) — touch swipe

useHorizontalSwipe.ts — generic threshold-based swipe composable
useGesture.ts — setSwipeTrackingEnabled(false) while the lightbox is open
```

##### 4.3.3.2 Chrome layout

- Uses the standard `BModal` chrome (consistent with QRCodeModal):
  - Header title = picture description (`t("text-" + id)`).
  - Footer: icon buttons on the left (prev / next / QR-share /
    related-link) and a text **Close** button on the right.
- The image is centred in the stage (`object-fit: contain`, `.no-copy`),
  `size="lg"` dialog — no fullscreen on mobile, no responsive bars.

##### 4.3.3.3 Deep link (?preview=<id>)

- GalleryPage reads `route.query.preview`; when it matches a picture id and
  the viewer is not already open, it pushes the viewer.
- Thumbnail clicks open the viewer first, then `router.replace` to sync
  `?preview=` (so the QR deep link works from any entry point).
- Prev/next navigation updates `?preview=` via `router.replace` (the page
  ignores route changes while the viewer is open).
- Closing the viewer strips `?preview=` (keeping `?lang=`).

##### 4.3.3.4 Navigation

- Bottom-bar prev/next buttons (disabled at boundaries).
- Keyboard: Left/Right arrows switch, `Esc` closes (BModal built-in), focus
  stays trapped in the modal.
- Touch: horizontal swipe over the image stage (`useHorizontalSwipe`) — a
  progressive enhancement over buttons + keyboard. Offcanvas edge-swipes
  are suppressed while the lightbox is open
  (`useGesture.setSwipeTrackingEnabled(false)`).

##### 4.3.3.5 Preview-only

The enlarged image uses `.no-copy`; no download / open-original buttons.
QR share encodes the current deep link with `hideOpenLink: true` (internal
link); the centre icon never falls back to the poster itself (defaults to
the `steve-hsu.svg` signature).
