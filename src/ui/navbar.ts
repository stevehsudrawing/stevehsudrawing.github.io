/**
 * Navbar bridge — delegates to the Vue AppNavbar component.
 *
 * The AppNavbar component handles active item highlighting and
 * brand text updates reactively.  This module provides a thin
 * bridge for legacy TS consumers (page-content-initializer.ts, lang-switcher.ts).
 */

function get(): NonNullable<Window["__navbar"]> | null {
  return window.__navbar ?? null;
}

/**
 * Highlight the navbar link matching the current page path.
 * Delegates to AppNavbar (handled reactively — no-op for compat).
 */
export function setActiveNavItem(): void {
  get()?.setActiveNavItem();
}

/**
 * Update the navbar-brand page-name text.
 * Delegates to AppNavbar (handled reactively — no-op for compat).
 */
export function updateNavbarBrandText(): void {
  get()?.updateNavbarBrandText();
}
