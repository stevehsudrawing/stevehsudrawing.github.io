/**
 * Service-worker registration.
 *
 * Registers `public/sw.js` — the copy-protection + offline worker.
 * The registration is production-only by default; in dev it needs an
 * explicit `?sw=1`, because the dev server restarts and HMR must never
 * ride on cached responses.
 *
 * Registration failures are swallowed: the worker is a progressive
 * enhancement, and the site behaves exactly as before without it.
 */

/**
 * Register the service worker (production default, `?sw=1` in dev).
 */
export function initServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;

  const requestedInDev = new URLSearchParams(window.location.search).has("sw");
  if (!import.meta.env.PROD && !requestedInDev) return;

  void navigator.serviceWorker.register("/sw.js").catch(() => {
    // Progressive enhancement — a failed registration is non-fatal.
  });
}
