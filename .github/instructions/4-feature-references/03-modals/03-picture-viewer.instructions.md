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
  │    props: { contents, currentId } }  (pop when ?preview= removed)
  ├─ PictureCard @select → openViewer + router.push(?preview=)  (history entry)
  ├─ watch viewerOpen (stack) → strip ?preview= on close
  └─ onBeforeUnmount → clear() the stack when the route leaves /gallery.html

PictureViewerModal.vue
  ├─ useStackModal("picture-viewer") → visible + props
  ├─ contents + currentId → internal index (prev/next)
  ├─ Chrome: footer icon buttons (prev/next/QR/related) + text Close
  ├─ QR share: QRCodeButton → qr-code modal (current deep link, hideOpenLink)
  ├─ Related link: TypeAwareLink v-bind="relatedLink" (TypeAwareLinkProps;
  │    click clears the whole stack before navigating)
  ├─ Close button: pop() (stay on the gallery); Back button
  │    (router.back(), shown only when entered cross-page — derived from
  │    history.state.back vs the current path)
  ├─ Slide transition: symmetric <Transition mode="out-in"> on prev/next
  └─ useHorizontalSwipe(stageRef, { onLeft, onRight }) — touch swipe

useHorizontalSwipe.ts — generic threshold-based swipe composable
useGesture.ts — setSwipeTrackingEnabled(false) while the lightbox is open
```

##### 4.3.3.2 Chrome layout

- Uses the standard `BModal` chrome (consistent with QRCodeModal):
  - Header title = picture description (`t("text-" + id)`).
  - Footer: icon buttons on the left (prev / next / QR-share /
    related-link); on the right a text **Back** button (only when the
    viewer was entered from another page — `cameFromAnotherPage` via
    `history.state.back`) and a text **Close** button.
- The image is centred in the stage (`object-fit: contain`, `.no-copy`),
  `size="lg"` dialog — no fullscreen on mobile, no responsive bars.

##### 4.3.3.3 Deep link (?preview=<id>) + history management

- GalleryPage reads `route.query.preview`; when it matches a picture id and
  the viewer is not already open, it pushes the viewer; when `?preview=` is
  removed while the viewer is open, it pops it (idempotent).
- Thumbnail clicks open the viewer first, then `router.push` to create a
  history entry (so Back / the Close button return to the plain gallery
  page, keeping scroll; the page ignores route changes while open).
- Prev/next navigation updates `?preview=` via `router.replace` (single
  modal history entry).
- **Close button** = `pop()` — always dismiss the viewer and stay on the
  gallery (the `viewerOpen` watch strips `?preview=`, keeping `?lang=`).
- **Back button** (shown only when the viewer was entered via a cross-page
  navigation — derived from `history.state.back` vs the current path) =
  `router.back()`: returns to the original page; GalleryPage
  `onBeforeUnmount` clears the stack; `scrollBehavior` restores the
  original scroll (§4.4.2). Esc / backdrop close via `clear()`.
- Same-page navigations skip the LoadingBar and scroll — see §4.1.6 and
  §4.4.2.

##### 4.3.3.4 Navigation

- Bottom-bar prev/next buttons (disabled at boundaries).
- Keyboard: Left/Right arrows switch, `Esc` closes (BModal built-in), focus
  stays trapped in the modal.
- Touch: horizontal swipe over the image stage (`useHorizontalSwipe`) — a
  progressive enhancement over buttons + keyboard. Offcanvas edge-swipes
  are suppressed while the lightbox is open
  (`useGesture.setSwipeTrackingEnabled(false)`).
- **Slide transition**: prev/next uses a symmetric mirror animation
  (`<Transition mode="out-in">` keyed by the picture id, wrapped in a
  `.picture-slide-wrap` div so transforms apply to a block element).
  `dir` ("next"/"prev") is set in `goTo` before the id changes so the
  leaving picture exits toward the side the new one enters from. The
  enter/exit offset rules collapse to two because `enter-from-next` ≡
  `leave-to-prev` and `leave-to-next` ≡ `enter-from-prev`. No animation
  on open (no `appear`); reduced-motion / `.no-animations` are handled
  globally by `accessibility.css`.

##### 4.3.3.5 Preview-only

The enlarged image uses `.no-copy`; no download / open-original buttons.
QR share encodes the current deep link with `hideOpenLink: true` (internal
link); the centre icon never falls back to the poster itself (defaults to
the `steve-hsu.svg` signature).
