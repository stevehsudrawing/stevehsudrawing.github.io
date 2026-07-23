/**
 * Page Content Initializer
 * Called both on first page load and after SPA page transitions.
 * Re-wires all interactive elements in #page-content:
 * i18n, link cards, tooltips, images, SVGs, scroll hints, etc.
 *
 * Future layering: this belongs in features/ (orchestration layer)
 * because it depends on nearly every other module.
 */

import { currentLang, langData, updatePageText, setActiveLangItem } from '../core/i18n.js';
import { updateNavbarBrandText, setActiveNavItem } from '../ui/navbar.js';
import { updatePageTitle } from '../ui/page-title.js';
import { generateLinkCards } from './link-cards-generator.js';
import { initAllCopyLinkTooltips, initAllTooltips } from '../ui/tooltips.js';
import { initAllTitleLinkAnchors, addAllExternalLinkIndicators } from '../core/accessibility.js';
import { applyAllThemeBasedImages } from '../ui/theme.js';
import { initAllColoredImages, initAllImageLoadingOpacity } from '../core/img-utils.js';
import { initSvgInjection } from '../core/svg-utils.js';
import { applyAllExternalLinkTargetBehavior } from '../ui/settings.js';
import { initAllScrollHints } from '../ui/scroll-hint.js';

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
        const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
        if (languageSelect) {
            languageSelect.value = currentLang;
        }
    }

    await generateLinkCards();

    if (currentLang && Object.keys(langData).length > 0) {
        updatePageText();
    }

    initAllCopyLinkTooltips();
    initAllTooltips();
    initAllTitleLinkAnchors();
    applyAllThemeBasedImages();
    initAllColoredImages();
    initAllImageLoadingOpacity();
    await initSvgInjection();
    applyAllExternalLinkTargetBehavior();
    addAllExternalLinkIndicators();
    initAllScrollHints();
}
