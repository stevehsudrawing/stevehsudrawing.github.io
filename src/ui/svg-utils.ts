/**
 * SVG injection bridge -- delegates to the composable.
 *
 * The useSvgInjection composable handles the global document scan.
 * This module provides a thin bridge for legacy TS consumers
 * (page-content-initializer.ts, qr-code.ts).
 */

export { initSvgInjection } from "../composables/useSvgInjection";
