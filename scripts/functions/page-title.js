/**
 * Page Title module.
 * Updates document.title based on the current page and active language.
 * Format: "Page Name - Site Name" (except homepage which shows only site name).
 */

/**
 * Update the document title according to the current page and language.
 * - Homepage (index.html): just the site name.
 * - Other pages: "Page Name - Site Name".
 */
function updatePageTitle() {
    const pageName = extractPageName(window.location.pathname);
    const pageKey = 'text-' + pageName;
    const siteKey = 'text-steve-hsu-s-link-hub';

    const pageTitle = translate(pageKey);
    const siteTitle = translate(siteKey);

    if (pageName === 'index') {
        // Homepage: show site name only
        document.title = siteTitle || 'Steve Hsu\'s Link-Hub';
    } else if (pageTitle && siteTitle) {
        document.title = pageTitle + ' - ' + siteTitle;
    } else if (siteTitle) {
        // Fallback: page name key missing, show site name only
        document.title = siteTitle;
    } else {
        // Ultimate fallback
        document.title = 'Steve Hsu\'s Link-Hub';
    }
}
