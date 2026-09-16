/**
 * useSwiperMode — the resolved "use Swiper" mode for the session.
 *
 * Combines the platform capability probe (`isSwiperSupported`) with the
 * user's `enableSwiper` preference (default `true`) into one reactive
 * condition.  The hero carousel and the group viewer branch on
 * `swiperEnabled`; the preference applies LIVE — `useStoredValue` shares
 * one ref per accessor, so a Settings-modal toggle flips every consumer
 * immediately.
 *
 * Layering: this composable is the single place that composes the
 * platform probe with the stored preference (single source of truth —
 * components must not re-derive the condition).
 */

import { computed, type ComputedRef } from "vue";
import { isSwiperSupported } from "../platform/advanced-feat-support";
import {
  getStoredEnableSwiper,
  setStoredEnableSwiper,
} from "../platform/storage";
import { useStoredValue } from "./useStoredValue";

// =========================================================================
// Composable
// =========================================================================

/**
 * Resolve the Swiper mode.
 *
 * @returns `swiperSupported` — the browser capability probe (static per
 *   session; the Settings modal uses it for the disabled state);
 *   `swiperEnabled` — the live condition `supported && preferred`.
 */
export function useSwiperMode(): {
  swiperSupported: boolean;
  swiperEnabled: ComputedRef<boolean>;
} {
  const enableSwiper = useStoredValue(
    getStoredEnableSwiper,
    setStoredEnableSwiper,
    true,
  );
  const swiperSupported = isSwiperSupported();
  const swiperEnabled = computed(() => swiperSupported && enableSwiper.value);
  return { swiperSupported, swiperEnabled };
}
