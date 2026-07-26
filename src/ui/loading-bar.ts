/**
 * Loading bar UI component.
 * Manages a thin progress bar at the top of the viewport.
 * Used by both language switching and page transitions.
 */

/**
 * Show the progress bar and animate it to ~85 %.
 * Call {@link completeLoadingBar} when the operation finishes,
 * or {@link hideLoadingBar} to dismiss it immediately on error.
 */
export function showLoadingBar(): void {
  const bar = document.getElementById("page-transition-progress");
  if (!bar) return;
  // Reset
  bar.classList.remove("done");
  bar.style.display = "";
  // Force reflow so the reset takes effect before adding 'active'
  void (bar as HTMLElement).offsetWidth;
  bar.classList.add("active");
}

/**
 * Complete the progress bar: animate to 100 % then fade out.
 */
export function completeLoadingBar(): void {
  const bar = document.getElementById("page-transition-progress");
  if (!bar) return;
  bar.classList.add("done");
  bar.classList.remove("active");
  // Hide after the completion transition (350 ms)
  setTimeout(() => {
    bar.classList.remove("done");
    bar.style.display = "none";
  }, 350);
}

/**
 * Immediately hide the progress bar without the completion animation.
 * Used when an operation fails and the bar should disappear instantly.
 */
export function hideLoadingBar(): void {
  const bar = document.getElementById("page-transition-progress");
  if (!bar) return;
  bar.classList.remove("active", "done");
  bar.style.display = "none";
}
