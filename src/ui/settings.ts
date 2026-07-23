/**
 * Settings panel event handling.
 * Manages the settings modal's toggles for opening external links in new tabs
 * and enabling animations, the language selector, and the reset workflow
 * with a confirmation modal.
 */

import type { ThemeChoice } from '../types/app.js';
import { StorageKey } from '../types/app.js';
import { currentLang, loadLang, translate } from '../core/i18n.js';
import { htmlElement, setThemePreference } from './theme.js';
import { createTooltip, disposeTooltip } from './tooltips.js';

/**
 * Attach delegated event listeners for settings-related UI:
 * - External links new-tab toggle
 * - Language selector
 * - Reset button + confirmation
 * - Settings-open button
 * - Language dropdown items
 * - Theme dropdown items
 */
export function initSettingEventListeners(): void {
    document.addEventListener('change', function (e: Event) {
        const target = e.target as HTMLElement;

        // External links new tab toggle
        if (target && target.id === 'external-links-new-tab-toggle') {
            const checked = (target as HTMLInputElement).checked;
            setExternalLinkNewTabPreference(checked);
            applyAllExternalLinkTargetBehavior();
            return;
        }

        // Enable animations toggle
        if (target && target.id === 'enable-animations-toggle') {
            const checked = (target as HTMLInputElement).checked;
            setAnimationPreference(checked);
            applyAnimationPreference();
            return;
        }

        // Language select
        if (target && target.id === 'language-select') {
            const selectedLang = (target as HTMLSelectElement).value;
            loadLang(selectedLang);
            return;
        }
    });

    document.addEventListener('click', function (e: MouseEvent) {
        const target = e.target as HTMLElement;

        // Button of confirming reset
        if (target && target.id === 'confirm-reset-btn') {
            try {
                localStorage.removeItem(StorageKey.Lang);
                localStorage.removeItem(StorageKey.Theme);
                localStorage.removeItem(StorageKey.OpenInNewTab);
                localStorage.removeItem(StorageKey.EnableAnimations);
            } catch (err) {
                console.warn('Failed to clear some preferences:', err);
            }

            window.location.href = '/index.html';
            return;
        }

        const settingsOpenButton = target.closest('[data-settings-open]');
        if (settingsOpenButton) {
            e.preventDefault();
            const modalElement = document.getElementById('settings-modal');
            if (modalElement) {
                const bootstrapModal = new window.bootstrap.Modal(modalElement);
                bootstrapModal.show();
            }
            return;
        }

        const langItem = target.closest('[data-lang]');
        if (langItem) {
            e.preventDefault();
            const selectedLang = langItem.getAttribute('data-lang');
            if (selectedLang) {
                loadLang(selectedLang);
            }
            return;
        }

        const themeItem = target.closest('.theme-item');
        if (themeItem) {
            e.preventDefault();
            const selectedTheme = themeItem.getAttribute('data-theme');
            if (selectedTheme) {
                setThemePreference(selectedTheme as ThemeChoice);
            }
        }
    });
}

/**
 * Read the "open external links in new tab" preference from localStorage.
 * @returns True if external links should open in a new tab.
 */
export function isExternalLinkNewTabEnabled(): boolean {
    return localStorage.getItem(StorageKey.OpenInNewTab) !== 'false';
}

/**
 * Persist the "open external links in new tab" preference to localStorage.
 * @param enabled - Whether external links should open in a new tab.
 */
export function setExternalLinkNewTabPreference(enabled: boolean): void {
    localStorage.setItem(StorageKey.OpenInNewTab, enabled ? 'true' : 'false');
}

/**
 * Add external-link new-tab behavior to a single .external-link anchor.
 * Sets target="_blank" and rel="noopener noreferrer".
 * @param link - The external link to modify.
 */
export function addExternalLinkTargetBehavior(link: HTMLAnchorElement): void {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
}

/**
 * Remove external-link new-tab behavior from a single .external-link anchor.
 * Only removes attributes when they match the expected values, preserving
 * any manually-set target or rel attributes.
 * @param link - The external link to modify.
 */
export function removeExternalLinkTargetBehavior(link: HTMLAnchorElement): void {
    if (link.getAttribute('target') === '_blank') {
        link.removeAttribute('target');
    }
    if (link.getAttribute('rel') === 'noopener noreferrer') {
        link.removeAttribute('rel');
    }
}

/**
 * Apply the external-link target preference to all .external-link anchors.
 * Reads the stored preference and delegates to addExternalLinkTargetBehavior()
 * or removeExternalLinkTargetBehavior() for each matching element.
 */
export function applyAllExternalLinkTargetBehavior(): void {
    const enabled = isExternalLinkNewTabEnabled();
    const action = enabled ? addExternalLinkTargetBehavior : removeExternalLinkTargetBehavior;
    document.querySelectorAll<HTMLAnchorElement>('a.external-link').forEach(action);
}

/**
 * Read the "enable animations" preference from localStorage.
 * @returns True if animations should be enabled.
 */
export function isAnimationEnabled(): boolean {
    return localStorage.getItem(StorageKey.EnableAnimations) !== 'false';
}

/**
 * Persist the "enable animations" preference to localStorage.
 * @param enabled - Whether animations should be enabled.
 */
export function setAnimationPreference(enabled: boolean): void {
    localStorage.setItem(StorageKey.EnableAnimations, enabled ? 'true' : 'false');
}

/**
 * Apply the animation preference by toggling the .no-animations class
 * on the <html> element.
 */
export function applyAnimationPreference(): void {
    const enabled = isAnimationEnabled();
    if (enabled) {
        htmlElement.classList.remove('no-animations');
    } else {
        htmlElement.classList.add('no-animations');
    }
}

/**
 * Initialize the settings modal on first call (idempotent via body attribute).
 * Syncs the toggle and select values with stored preferences.
 */
export function initSettingsModal(): void {
    // Prevent duplicate initialization, which can happen after page transitions
    if (document.body.hasAttribute('data-settings-modal-initialized')) {
        // Sync toggle state and apply external link target behavior
        // in case the DOM was recreated after navigation
        const settingsToggle = document.getElementById('external-links-new-tab-toggle') as HTMLInputElement | null;
        if (settingsToggle) {
            settingsToggle.checked = isExternalLinkNewTabEnabled();
        }
        updateAnimationToggleState();
        applyAllExternalLinkTargetBehavior();
        return;
    }
    document.body.setAttribute('data-settings-modal-initialized', '');

    // Sync initial values for UI elements (events handled via delegation)
    const settingsToggle = document.getElementById('external-links-new-tab-toggle') as HTMLInputElement | null;
    if (settingsToggle) {
        settingsToggle.checked = isExternalLinkNewTabEnabled();
    }

    updateAnimationToggleState();

    // Listen for OS-level reduced-motion preference changes
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', function () {
        updateAnimationToggleState();
    });

    const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
    if (languageSelect) {
        languageSelect.value = currentLang;
    }

    applyAllExternalLinkTargetBehavior();
    applyAnimationPreference();
}

/**
 * Update the animation toggle state based on the system reduced-motion
 * preference. When the system prefers reduced motion, the toggle is
 * disabled (unchecked) and a tooltip explains why. Otherwise the toggle
 * reflects the user's stored preference.
 */
export function updateAnimationToggleState(): void {
    const toggle = document.getElementById('enable-animations-toggle') as HTMLInputElement | null;
    if (!toggle) return;

    const label = document.querySelector('label[for="enable-animations-toggle"]') as HTMLElement | null;
    const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (systemReduced) {
        toggle.disabled = true;
        toggle.checked = false;
        if (label) {
            const tooltipText = typeof translate === 'function'
                ? translate('text-animations-disabled-by-system-description', 'Animations are disabled by your system settings.')
                : 'Animations are disabled by your system settings.';
            label.setAttribute('data-bs-toggle', 'tooltip');
            label.setAttribute('data-bs-title', tooltipText);
            label.setAttribute('data-i18n-tooltip', 'text-animations-disabled-by-system-description');
            createTooltip(label);
        }
    } else {
        toggle.disabled = false;
        toggle.checked = isAnimationEnabled();
        if (label) {
            disposeTooltip(label);
            label.removeAttribute('data-bs-toggle');
            label.removeAttribute('data-bs-title');
            label.removeAttribute('data-i18n-tooltip');
        }
    }
}
