/**
 * Page Content Initializer
 * Called both on first page load and after SPA page transitions.
 * Re-wires all interactive elements in #page-content:
 * i18n, link cards, tooltips, images, SVGs, scroll hints, etc.
 *
 * Future layering: this belongs in features/ (orchestration layer)
 * because it depends on nearly every other module.
 */

import {
  currentLang,
  langData,
  updatePageText,
  setActiveLangItem,
} from "../core/i18n";
import { AppEvent } from "../types/app";
import { updateNavbarBrandText, setActiveNavItem } from "../ui/navbar";
import { updatePageTitle } from "../ui/page-title";
import { initAllTooltips } from "../ui/tooltips";
import { initAllCopyLinkBehavior } from "../ui/copy-link";
import {
  initAllTitleLinkAnchors,
  addAllExternalLinkIndicators,
} from "../ui/accessibility";
import {
  applyAllThemeBasedImages,
  applyAllThemeBasedSources,
} from "../ui/theme";
import {
  initAllColoredImages,
  initAllImageLoadingOpacity,
} from "../ui/img-utils";
import { initSvgInjection } from "../ui/svg-utils";
import { applyAllExternalLinkTargetBehavior } from "../ui/external-link-behavior";
import { initAllScrollHints } from "../ui/scroll-hint";

/**
 * Initialize page-content-specific elements.
 * Call after the #page-content DOM has been replaced (page transition)
 * or on the initial page load.
 */
export async function initPageContent(): Promise<void> {
  updateNavbarBrandText();

  if (currentLang && Object.keys(langData).length > 0) {
    updatePageText();
    updatePageTitle();
    setActiveNavItem();
    setActiveLangItem();
    const languageSelect = document.getElementById(
      "language-select",
    ) as HTMLSelectElement | null;
    if (languageSelect) {
      languageSelect.value = currentLang;
    }
  }

  initAllCopyLinkBehavior();
  initAllTooltips();
  initAllTitleLinkAnchors();
  applyAllThemeBasedImages();
  applyAllThemeBasedSources();
  initAllColoredImages();
  initAllImageLoadingOpacity();
  await initSvgInjection();
  applyAllExternalLinkTargetBehavior();
  addAllExternalLinkIndicators();
  initAllScrollHints();

  // Notify Vue components that page content has been replaced
  document.dispatchEvent(new CustomEvent(AppEvent.PageInitialized));
}
