/**
 * SVG injection bridge — delegates to the Vue InlineSvg component.
 *
 * The InlineSvg component handles both Vue template usage (props-based)
 * and global document scan (initAll).  This module provides a thin
 * bridge for legacy TS consumers (page-content-initializer.ts, qr-code.ts).
 */

/**
 * Initialize SVG injection for all [data-role="svg"] placeholders.
 */
export async function initSvgInjection(): Promise<void> {
  await window.__svgInjection?.initAll();
}
