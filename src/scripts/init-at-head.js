
import { applyThemePreference, currentThemePreference, initSystemThemeListener, initThemePreference } from './functions/ui/theme.js';

initThemePreference();
initSystemThemeListener();
applyThemePreference(currentThemePreference, false);