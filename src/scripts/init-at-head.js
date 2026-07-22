
import { applyThemePreference, currentThemePreference, initSystemThemeListener, initThemePreference } from './ui/theme.js';

initThemePreference();
initSystemThemeListener();
applyThemePreference(currentThemePreference, false);