/**
 * Page Title module.
 * Updates document.title based on the current page and active language.
 * Format: "Page Name - Site Name" (except homepage which shows only site name).
 *
 * Called from App.vue router.afterEach (navigation) and
 * useI18n.setLocale() (language switch).
 */

import { extractPageName } from "../core/utils";
import { useI18n } from "../composables/useI18n";

/** Use `t()` from `useI18n()` to replace deprecated legacy `translate()`. */
const { t } = useI18n();

/**
 * Update the document title according to the current page and language.
 * - Homepage (index.html): just the site name.
 * - Other pages: "Page Name - Site Name".
 * @param pathname - Optional pathname override.  Defaults to window.location.pathname.
 */
export function updatePageTitle(pathname?: string): void {
  const pageName = extractPageName(pathname ?? window.location.pathname);
  const pageKey = "text-" + pageName;
  const siteKey = "text-steve-hsu-s-link-hub";

  const pageTitle = t(pageKey);
  const siteTitle = t(siteKey);

  if (pageName === "index") {
    // Homepage: show site name only
    document.title = siteTitle || "Steve Hsu's Link-Hub";
  } else if (pageTitle && siteTitle) {
    document.title = pageTitle + " - " + siteTitle;
  } else if (siteTitle) {
    // Fallback: page name key missing, show site name only
    document.title = siteTitle;
  } else {
    // Ultimate fallback
    document.title = "Steve Hsu's Link-Hub";
  }
}
