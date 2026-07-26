/**
 * External link target behavior.
 * Manages the preference for opening external links in a new tab,
 * and applies/removes target="_blank" on all .external-link anchors.
 */

import { StorageKey } from "../types/app.js";

/**
 * Read the "open external links in new tab" preference from localStorage.
 * @returns True if external links should open in a new tab.
 */
export function isExternalLinkNewTabEnabled(): boolean {
  return localStorage.getItem(StorageKey.OpenInNewTab) !== "false";
}

/**
 * Persist the "open external links in new tab" preference to localStorage.
 * @param enabled - Whether external links should open in a new tab.
 */
export function setExternalLinkNewTabPreference(enabled: boolean): void {
  localStorage.setItem(StorageKey.OpenInNewTab, enabled ? "true" : "false");
}

/**
 * Add external-link new-tab behavior to a single .external-link anchor.
 * Sets target="_blank" and rel="noopener noreferrer".
 * @param link - The external link to modify.
 */
export function addExternalLinkTargetBehavior(link: HTMLAnchorElement): void {
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
}

/**
 * Remove external-link new-tab behavior from a single .external-link anchor.
 * Only removes attributes when they match the expected values, preserving
 * any manually-set target or rel attributes.
 * @param link - The external link to modify.
 */
export function removeExternalLinkTargetBehavior(
  link: HTMLAnchorElement,
): void {
  if (link.getAttribute("target") === "_blank") {
    link.removeAttribute("target");
  }
  if (link.getAttribute("rel") === "noopener noreferrer") {
    link.removeAttribute("rel");
  }
}

/**
 * Apply the external-link target preference to all .external-link anchors.
 * Reads the stored preference and delegates to addExternalLinkTargetBehavior()
 * or removeExternalLinkTargetBehavior() for each matching element.
 */
export function applyAllExternalLinkTargetBehavior(): void {
  const enabled = isExternalLinkNewTabEnabled();
  const action = enabled
    ? addExternalLinkTargetBehavior
    : removeExternalLinkTargetBehavior;
  document
    .querySelectorAll<HTMLAnchorElement>("a.external-link")
    .forEach(action);
}
