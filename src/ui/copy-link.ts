/**
 * Copy-link behavior -- click-to-copy with Toast feedback.
 *
 * Extracted from tooltips.ts (§4.5 Phase A).
 * Copy-link was originally coupled with tooltip decoration;
 * the clipboard + Toast path is now independent.  Tooltip decoration
 * (desktop-only) is retained as an optional add-on via initCopyLinkTooltip,
 * which sets data-bs-* attributes consumed by initAllTooltips().
 */

import { translate } from "../core/i18n";
import { showToast } from "./toast";
import { disposeTooltip } from "./tooltips";

/** True when the primary input cannot hover (touchscreens). */
const isTouchDevice = window.matchMedia("(any-hover: none)").matches;

// =========================================================================
// Click-to-copy (all devices)
// =========================================================================

/**
 * Click handler for .copy-link elements.
 * Copies the text from data-copy-text to the clipboard, then shows
 * a success toast on both desktop and mobile (tooltip is unreliable
 * on touchscreens and may persist as an orphaned overlay).
 * @param e - The click event.
 */
export function handleCopyLinkClick(e: MouseEvent): void {
  e.preventDefault();
  const link = e.currentTarget as HTMLElement;
  const copyText = link.getAttribute("data-copy-text");
  if (!copyText) return;

  navigator.clipboard
    .writeText(copyText)
    .then(function () {
      const copiedText =
        translate("text-copied-text", "Copied text") + ": " + copyText;
      showToast("success", copiedText);
    })
    .catch(function (err) {
      showToast("error", "Failed to copy text");
      console.error("Failed to copy text:", err);
    });
}

/**
 * Initialize the click-to-copy listener on a single .copy-link element.
 * Separate from tooltip decoration so the copy behavior works on both
 * desktop and mobile (tooltip is skipped on touchscreens).
 * @param link - The .copy-link element to initialize.
 */
export function initCopyLinkClick(link: HTMLAnchorElement): void {
  link.addEventListener("click", handleCopyLinkClick);
}

/**
 * Remove the click-to-copy listener from a single .copy-link element.
 * @param link - The .copy-link element to dispose.
 */
export function disposeCopyLinkClick(link: HTMLAnchorElement): void {
  link.removeEventListener("click", handleCopyLinkClick);
}

// =========================================================================
// Tooltip decoration (desktop only -- optional)
// =========================================================================

/**
 * Decorate a single .copy-link element with Bootstrap tooltip attributes.
 * Only called on desktop -- touchscreens skip tooltip initialization.
 * The actual Bootstrap Tooltip instance is created later by
 * {@link initAllTooltips} (in tooltips.ts).
 * @param link - The .copy-link element to decorate.
 */
export function initCopyLinkTooltip(link: HTMLAnchorElement): void {
  link.setAttribute("data-bs-toggle", "tooltip");
  link.setAttribute("data-bs-trigger", "hover focus");
  link.setAttribute("data-i18n-tooltip", "text-click-to-copy");

  const initialTitle = translate("text-click-to-copy", "Click to Copy");
  link.setAttribute("data-bs-title", initialTitle);
}

/**
 * Remove Bootstrap tooltip decoration and click listener from a single
 * .copy-link element.
 * @param link - The .copy-link element to dispose.
 */
export function disposeCopyLinkTooltip(link: HTMLAnchorElement): void {
  disposeCopyLinkClick(link);
  link.removeAttribute("data-bs-toggle");
  link.removeAttribute("data-bs-trigger");
  link.removeAttribute("data-i18n-tooltip");
  link.removeAttribute("data-bs-title");
  disposeTooltip(link);
}

// =========================================================================
// Batch initialization
// =========================================================================

/**
 * Initialize click-to-copy behavior on all .copy-link elements.
 * On desktop, also attaches tooltip decoration.
 * Delegates to initCopyLinkClick() + initCopyLinkTooltip().
 */
export function initAllCopyLinkBehavior(): void {
  try {
    const links = document.querySelectorAll<HTMLAnchorElement>(".copy-link");
    // Copy behavior: all devices
    links.forEach(initCopyLinkClick);
    // Tooltip decoration: desktop only
    if (!isTouchDevice) {
      links.forEach(initCopyLinkTooltip);
    }
  } catch (error) {
    console.error("Failed to initialize copy link tooltips:", error);
  }
}
