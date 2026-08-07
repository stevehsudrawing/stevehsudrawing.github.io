# TODO

> Last updated: 2026-08-07

---

## Phase 0-6 — Vue 3 Migration Foundation ✅

- **Phase 0**: Vue 3 + `bootstrap-vue-next` shell, `createApp` + `mount("#app")` in `main.ts`
- **Phase 1**: Stylesheets reorganized — global CSS vs component CSS
- **Phase 2**: Composables layer — `useLocalStorage`, `useTheme`, `useI18n`
- **Phase 3**: Modal components — `SettingsModal`, `ExternalLinkConfirmModal`, `QRCodeModal` via `<BModal>`
- **Phase 4**: UI components — 8 SFCs migrated from `ui/*.ts`; `useSvgInjection`, `useImgFeatures`, `useToast`
- **Phase 5**: Cleanup — deleted `src/stylesheets/components/`, `build/page-components/`, dead legacy modules
- **Phase 6**: Documentation — restructured `.github/instructions/` into 5 functional subdirectories

## Phase 7 — SPA Navigation + Bridge Elimination ✅

- Vue Router (`createWebHistory`, 7 routes, lazy-loaded page components)
- `usePageNavigation()` — router guard orchestration (LoadingBar, dimming, indicators, title, `?lang=`)
- Link cards & button groups migrated to Vue components + `src/configs/` JSON
- All `window.__xxx` bridges and `src/features/` + `src/ui/` legacy modules deleted
- Build system cleaned — no more HAST link-card/button-group injection
- `ScrollHint` merged into `LinkButtonGroup.vue`; `OffcanvasNav` uses `BOffcanvas`

## Post-Phase 7 Refinements ✅

- `SectionHeading.vue` + `AnchorButton.vue` + `CopyButton.vue` — reusable heading anchors
- `HeroSection.vue` — 8 hero sections across 7 pages collapsed into one component
- `HeroImageProps` interface in `types/app.ts`
- `SkipButton.vue` — accessibility skip-to-content component
- `initInputModalityDetection()` — replaces `initSkipButton()` (keyboard/pointer/touch mode)
- `MarkdownArticle.vue` — Markdown renderer with HAST pipeline + desktop/mobile scrollspy
- Copyright page (`/copyright-notice.html`) added to router
- `useModalFocus()` — keyboard-aware BModal auto-focus
- `useCrossModalNavigation()` — cross-modal state machine (ExternalLink ↔ QRCode)
- `t()` / `$t()` — `%1`, `%2` placeholder params for i18n strings
- `StorageKey.EnableAnimations` wired to `<html>.no-animations` class
- Mobile scroll offset computed dynamically (`navbar 64 + bar 48 + list.offsetHeight`)
- Carousel play/pause toggle with touch-mode control visibility
- Instruction files updated — §2.3 split into General / Legacy / Vue; §4.1.6, §4.1.7, §4.2.9–4.2.11 added
