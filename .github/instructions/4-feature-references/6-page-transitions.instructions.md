---
description: >
  Page transitions: SPA-style animated navigation between internal pages (.internal-link), progress
  bar animation, content dimming, interaction with tooltips (dispose before transition), settings
  (re-init after transition), i18n (re-apply translations), loading screen (restore content).
  Not loaded on error pages.
  Use when: modifying page-transition.ts, page-transition.css, or internal link navigation behavior.
applyTo: >
  src/features/page-transition.ts;
  src/stylesheets/page-transition.css
---

### 4.6 Page Transitions

**Brief**: Provides SPA-style animated transitions when navigating between internal pages.

**Related Files**:

| File                                  | Role                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| `src/features/page-transition.ts`     | Intercepts internal link clicks, manages transition animation |
| `src/stylesheets/page-transition.css` | Content dimming styles                                        |
| `src/ui/loading-bar.ts`               | Shared progress bar (also used by language switcher)          |
| `src/stylesheets/loading-bar.css`     | Progress bar styles                                           |

**How It Works**:

- Internal links (`class="internal-link"`) trigger SPA-style transitions instead of full page reloads.
- A progress bar (`#page-transition-progress`) animates at the top of the viewport.
- Content is dimmed during the transition.
- On error pages (404, error-unsupported-browser, error-javascript-disabled, all in `public/`), the Page Transition System is not loaded.

**Interaction with Other Systems**:

- **Utilities ([§4.15](15-utilities.instructions.md#415-utilities))**: Depends on `isInternalPage()`, `normalizeInternalPath()`, `INTERNAL_PAGES`, and `EXCLUDED_PAGES` (defined in `utils.ts`) for link classification and path resolution.
- **Tooltips ([§4.12](12-tooltips.instructions.md#412-tooltips))**: Calls `disposeAllTooltips()` before each transition to prevent orphaned tooltip instances.
- **External Link Confirmation ([§4.17](17-external-link-confirmation.instructions.md#417-external-link-confirmation))**: `shouldInterceptLink()` returns `false` for `.external-link` links, allowing the confirmation system to take over. The confirmation system uses `isInternalPage()` from `utils.ts` to avoid false positives.
- **Settings ([§4.8](8-settings-preferences.instructions.md#48-settings--preferences))**: After a page transition, `initPageContent()` re-invokes `initSettingsModal()` to re-sync toggle states with the recreated DOM.
- **i18n ([§4.3](3-internationalization-i18n.instructions.md#43-internationalization-i18n))**: After a page transition, `initPageContent()` calls `updatePageText()` and `updatePageTitle()` to apply translations to the new content.
- **Initialization ([§4.7](7-loading-screen.instructions.md#47-loading-screen))**: `navigateTo()` restores page content and completes the progress bar on success; on failure, falls back to a full browser navigation (`window.location.href`).
- **Image Utilities ([§4.13](13-image-utilities.instructions.md#413-image-utilities))**: After a page transition, `initPageContent()` calls both `applyAllThemeBasedImages()` and `applyAllThemeBasedSources()` to re-apply theme-based source swapping on the newly loaded `<img>` and `<source>` elements.
- **Error Pages ([§3.2.4](../3-project-structural-constraints/2-general-file-rules.instructions.md#324-html-page-tiers))**: The `public/404.html` page (and other error pages) are static HTML without the Page Transition System. This prevents layout conflicts when navigating from the 404 page back to full-feature pages.
