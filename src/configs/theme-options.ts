/**
 * Theme option configuration — the single source of truth for the theme
 * choices shown in the navbar dropdown and the settings modal.
 */

import type { ThemeChoice } from "../types/app";

/** One theme option: value, i18n key, and icon. */
export interface ThemeOption {
  /** Theme choice value. */
  value: ThemeChoice;
  /** i18n key for the display label. */
  i18nKey: string;
  /** Bootstrap Icons class for the navbar dropdown. */
  icon: string;
}

/** All theme options, in display order. */
export const THEME_OPTIONS: readonly ThemeOption[] = [
  { value: "auto", i18nKey: "text-auto", icon: "bi-circle-half" },
  { value: "light", i18nKey: "text-light", icon: "bi-sun-fill" },
  { value: "dark", i18nKey: "text-dark", icon: "bi-moon-stars-fill" },
];
