/**
 * Accessibility helpers.
 * Handles smooth-scroll to hash targets, keyboard/pointer/touch input
 * modality detection, and external link indicators.
 */

/**
 * Smooth-scroll the page to an element identified by a hash fragment.
 * @param hash - The hash fragment (with or without leading '#').
 * @param instant - If true, scroll instantly instead of smoothly.
 * @param offset - Offset position, in units of px, 64 in default.
 */
export function scrollToHashTarget(
  hash: string,
  instant = false,
  offset: number = 64,
): void {
  if (!hash) return;
  if (hash.startsWith("#")) {
    hash = hash.slice(1);
  }

  const target = document.getElementById(hash);
  if (!target) return;

  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const scrollTop = Math.max(0, targetTop - offset);
  window.scrollTo({ top: scrollTop, behavior: instant ? "auto" : "smooth" });
}

/**
 * Listen for hashchange events and scroll to the targeted element.
 * Used for in-page navigation via title-link-anchors and direct hash links.
 */
export function initHashChangeScroll(): void {
  window.addEventListener("hashchange", () => {
    scrollToHashTarget(window.location.hash, true);
  });
}

/**
 * Initialize input modality detection.
 * Toggles `.user-input-keyboard`, `.user-input-pointer`, and
 * `.user-input-touch` classes on `<html>` based on the user's
 * last input method.  These classes drive `:focus-visible` styling
 * via CSS selectors (e.g. `.user-input-keyboard :focus`).
 */
export function initInputModalityDetection(): void {
  const root = document.documentElement;

  function setKeyboardMode(): void {
    root.classList.add("user-input-keyboard");
    root.classList.remove("user-input-pointer", "user-input-touch");
  }

  function setPointerMode(): void {
    root.classList.add("user-input-pointer");
    root.classList.remove("user-input-keyboard", "user-input-touch");
  }

  function setTouchMode(): void {
    root.classList.add("user-input-touch");
    root.classList.remove("user-input-keyboard", "user-input-pointer");
  }

  // Keyboard navigation enables keyboard mode
  document.addEventListener(
    "keydown",
    function (e) {
      if (
        e.key === "Tab" ||
        e.key === "ArrowUp" ||
        e.key === "ArrowDown" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        setKeyboardMode();
      }
    },
    true,
  );

  // Pointer interaction enables pointer mode
  ["mousedown", "pointerdown"].forEach((evt) => {
    document.addEventListener(evt, setPointerMode, true);
  });

  // Touch interaction enables touch mode (separate from mouse pointer)
  document.addEventListener("touchstart", setTouchMode, true);
}
