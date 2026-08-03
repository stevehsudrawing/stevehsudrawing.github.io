/**
 * Bootstrap Tooltip lifecycle management.
 * Handles generic tooltip activation/disposal and i18n title updates.
 *
 * Copy-link behavior has been extracted to copy-link.ts (§4.5 Phase A).
 */

import { AppEvent } from "../types/app.js";
import { translate } from "../core/i18n.js";

/** True when the primary input cannot hover (touchscreens). */
const isTouchDevice = window.matchMedia("(any-hover: none)").matches;

/**
 * Create Bootstrap Tooltip instances for every element that has
 * the data-bs-toggle="tooltip" attribute.
 * Skipped on touch devices - tooltips cannot be dismissed on touchscreens
 * and will persist as orphaned overlays blocking interaction.
 */
export function initAllTooltips(): void {
  if (isTouchDevice) return;
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => createTooltip(el));
}

/**
 * Dispose all active Bootstrap Tooltip instances on the page.
 * Useful before page transitions to prevent orphaned tooltips.
 */
export function disposeAllTooltips(): void {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => disposeTooltip(el));
}

/**
 * Create a Bootstrap Tooltip instance on a single element.
 * Disposes any existing tooltip on the element first (idempotent).
 * @param element - The element to attach the tooltip to.
 * @returns The new tooltip instance.
 */
export function createTooltip(element: Element): bootstrap.Tooltip {
  disposeTooltip(element);
  return new window.bootstrap.Tooltip(element);
}

/**
 * Dispose a Bootstrap Tooltip instance from a single element, if one exists.
 * @param element - The element to remove the tooltip from.
 */
export function disposeTooltip(element: Element): void {
  const instance = window.bootstrap.Tooltip.getInstance(element);
  if (instance) {
    instance.dispose();
  }
}

/**
 * Update tooltip titles from i18n data attributes and recreate active
 * tooltip instances so they pick up the new title text.
 * Called automatically when the 'pageTextUpdated' event fires.
 */
export function updateAllTooltipTitles(): void {
  document
    .querySelectorAll('[data-bs-toggle="tooltip"][data-i18n-tooltip]')
    .forEach((el) => {
      const key = el.getAttribute("data-i18n-tooltip");
      const translated = translate(key!);
      if (translated) {
        el.setAttribute("data-bs-title", translated);
        if (window.bootstrap.Tooltip.getInstance(el)) {
          createTooltip(el);
        }
      }
    });
}

/**
 * Listen for the 'pageTextUpdated' custom event dispatched by i18n.js
 * and refresh tooltip titles in response to language changes.
 * Call once during page initialization.
 */
export function initTooltipI18nListener(): void {
  document.addEventListener(AppEvent.PageTextUpdated, updateAllTooltipTitles);
}
