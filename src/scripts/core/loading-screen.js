/**
 * Loading Screen System
 * Shows a full-screen loading overlay on initial page load,
 * fades out once DOMContentLoaded has completed.
 * Does NOT appear during SPA page transitions (page-transition.js).
 */

/**
 * Hide the loading screen with a fade-out animation.
 * The loading screen is removed from the DOM after the animation completes.
 */
export function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return;

    // Trigger fade-out
    loadingScreen.classList.add('fade-out');

    // Remove from DOM after the fade-out animation (500ms)
    setTimeout(() => {
        if (loadingScreen.parentNode) {
            loadingScreen.parentNode.removeChild(loadingScreen);
        }
    }, 500);
}
