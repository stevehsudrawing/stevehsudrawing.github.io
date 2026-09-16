/**
 * sw.js — service worker for Steve Hsu (什五)'s Link-Hub (v3.16.0).
 *
 * Three jobs, nothing else:
 *
 *   1. Tab navigations into a protected /images/** path get a synthetic
 *      403 page (`/403.html`) — the protected set is the glob list in
 *      `BLOCK_PATTERNS`, injected at build / dev-serve time from
 *      `public/images/README.md` by `build/sw-scope-plugin.ts`
 *      (§ 4.2.7 copy protection; a real edge rule is `future.md`
 *      § 5).  The two notice files stay reachable.
 *   2. Other tab navigations are network-first: the fresh HTML is
 *      cached per pathname, an offline request falls back to that
 *      cache — then to `error-offline.html`, served plainly as 200
 *      (the offline state is a client condition, not an HTTP claim).
 *   3. Hashed build assets under /assets/** are cache-first.
 *
 * Everything else (image subresources, external requests, non-GET
 * methods) passes straight through — the worker never interferes with
 * normal loading.  Without an installed worker the site is unchanged:
 * the block and the offline support are strictly progressive
 * enhancements.
 *
 * CACHE_VERSION: bump alongside every release that changes hashed
 * assets (stale `shlh-*` caches are deleted on activate).
 */

const CACHE_VERSION = "3.17.1";
const HTML_CACHE = `shlh-html-${CACHE_VERSION}`;
const STATIC_CACHE = `shlh-static-${CACHE_VERSION}`;

/** Page paths that bypass the image-navigation block (copyright notices). */
const NOTICE_PATHS = new Set(["/images/llms.txt", "/images/README.md"]);

/**
 * Glob patterns of the works documented in `public/images/README.md`
 * (relative to `/images/`), injected at build / dev-serve time by
 * `build/sw-scope-plugin.ts`.  An empty list (injection missing) falls
 * back to blocking every `/images/**` navigation — fail-safe.
 */
const BLOCK_PATTERNS = /* @__SW_SCOPE_PATTERNS__ */ [];

/** Precompiled pattern matchers. */
const BLOCK_MATCHERS = BLOCK_PATTERNS.map((glob) => globToRegExp(glob));

/** Error pages + the dependency closure needed to render them offline. */
const PRECACHE = [
  "/403.html",
  "/error-offline.html",
  "/legacy/base.css",
  "/legacy/env-detection.js",
  "/images/svg/icons/steve-hsu.svg",
  "/images/avif/stickers/light/wrong.avif",
  "/images/avif/stickers/dark/wrong.avif",
  "/images/webp/stickers/light/wrong.webp",
  "/images/webp/stickers/dark/wrong.webp",
  "/images/png/stickers/light/wrong.png",
  "/images/png/stickers/dark/wrong.png",
  "/images/avif/stickers/light/system-crash.avif",
  "/images/avif/stickers/dark/system-crash.avif",
  "/images/webp/stickers/light/system-crash.webp",
  "/images/webp/stickers/dark/system-crash.webp",
  "/images/png/stickers/light/system-crash.png",
  "/images/png/stickers/dark/system-crash.png",
  "/images/png/favicons/mono-black.png",
  "/images/png/favicons/mono-white.png",
];

// =========================================================================
// Lifecycle
// =========================================================================

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individual entries: one failed URL must not abort the whole set.
      await Promise.allSettled(
        PRECACHE.map(async (path) => {
          const response = await fetch(path);
          if (response.ok) await store(cache, path, response);
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("shlh-") &&
              key !== HTML_CACHE &&
              key !== STATIC_CACHE,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// =========================================================================
// Fetch routing
// =========================================================================

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Direct tab navigation into a protected /images/** path → 403.
  if (
    request.mode === "navigate" &&
    url.pathname.startsWith("/images/") &&
    !NOTICE_PATHS.has(url.pathname) &&
    isProtectedImagePath(url.pathname)
  ) {
    event.respondWith(forbiddenResponse());
    return;
  }

  // 2. Other tab navigations → network-first with an offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(request, url.pathname));
    return;
  }

  // 3. Hashed build assets → cache-first.
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(assetResponse(request));
    return;
  }

  // 4. Everything else (same-origin GET): a known cached file — the
  //    precache closure — answers from the static cache, everything
  //    else goes to the network.  Images are never stored, so they
  //    fall through to the network as before.
  event.respondWith(
    caches
      .match(request, { ignoreVary: true })
      .then((hit) => hit ?? fetch(request)),
  );
});

// =========================================================================
// Strategies
// =========================================================================

/**
 * Fetch a page body from the precache, falling back to the network.
 *
 * @param {string} path - Site-absolute page path.
 * @returns {Promise<string | null>} The HTML, or null when unavailable.
 */
async function pageHtml(path) {
  const hit = await caches.match(path, { ignoreVary: true });
  if (hit) return hit.text();
  try {
    const response = await fetch(path);
    return response.ok ? await response.text() : null;
  } catch {
    return null;
  }
}

/**
 * Build a synthetic HTML response (never stored — `no-store`).
 *
 * @param {string} path - Page path used as the body source.
 * @param {number} status - HTTP status for the synthetic response.
 * @param {string} statusText - HTTP status text.
 * @returns {Promise<Response>} The response to serve.
 */
async function syntheticResponse(path, status, statusText) {
  const html = await pageHtml(path);
  return new Response(html ?? `<!doctype html><title>${status}</title>`, {
    status,
    statusText,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Direct image navigation → 403 (the content policy, § 4.2.7).
 *
 * @returns {Promise<Response>} The 403 response.
 */
function forbiddenResponse() {
  return syntheticResponse("/403.html", 403, "Forbidden");
}

/**
 * Convert a path glob (`**` = any depth, `*` = within one segment —
 * the syntax documented in `public/images/README.md`) to an anchored
 * RegExp.
 *
 * @param {string} glob - Path glob relative to /images/.
 * @returns {RegExp} Anchored matcher for the relative path.
 */
function globToRegExp(glob) {
  let out = "^";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
      } else {
        out += "[^/]*";
      }
    } else if ("^$.|?*+()[]{}".includes(ch)) {
      out += "\\" + ch;
    } else {
      out += ch;
    }
  }
  return new RegExp(out + "$");
}

/**
 * Does a /images/** pathname belong to the protected works?  An empty
 * pattern list (missing injection) blocks everything — the v3.16.0
 * blanket behaviour as a fail-safe.
 *
 * @param {string} pathname - Request pathname starting with /images/.
 * @returns {boolean} True when the navigation should get the 403 page.
 */
function isProtectedImagePath(pathname) {
  if (BLOCK_MATCHERS.length === 0) return true;
  const relativePath = pathname.slice("/images/".length);
  return BLOCK_MATCHERS.some((matcher) => matcher.test(relativePath));
}

/**
 * Offline fallback → the error page, served plainly as 200
 * (a client-side state carries no HTTP claim).
 *
 * @returns {Promise<Response>} The offline response.
 */
function offlineResponse() {
  return syntheticResponse("/error-offline.html", 200, "OK");
}

/**
 * Store a normalized copy of a response.
 *
 * The browser keeps the original headers on a cached response while the
 * body is decoded, so `content-encoding` / `content-length` would lie —
 * and a `Vary` header (Vite preview sends `Vary: Origin`) makes later
 * matches miss even though the entry sits in the cache.  Stripping the
 * three headers keeps entries matchable and servable (the v3.16.0 war
 * story: render-blocking CSS failed offline while cached).
 *
 * @param {Cache} cache - The target cache.
 * @param {string | Request} key - Cache key (pathname or request).
 * @param {Response} response - The response to store (already cloned
 *   when the caller keeps serving the original).
 * @returns {Promise<void>}
 */
async function store(cache, key, response) {
  const headers = new Headers(response.headers);
  headers.delete("content-encoding");
  headers.delete("content-length");
  headers.delete("vary");
  await cache.put(
    key,
    new Response(await response.blob(), {
      status: response.status,
      statusText: response.statusText,
      headers,
    }),
  );
}

/**
 * Network-first navigation: fresh HTML wins, the cache answers when the
 * network fails, and the offline page covers everything else.
 *
 * @param {Request} request - The navigation request.
 * @param {string} pathname - Query-normalized cache key (SPA state such
 *   as `?lang=` / `?picGroupId=` is not part of the HTML).
 * @returns {Promise<Response>} The response to serve.
 */
async function navigationResponse(request, pathname) {
  const cache = await caches.open(HTML_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      try {
        await store(cache, pathname, response.clone());
      } catch {
        // Best-effort (quota / redirected responses).
      }
    }
    return response;
  } catch {
    const hit = await cache.match(pathname, { ignoreVary: true });
    return hit ?? (await offlineResponse());
  }
}

/**
 * Cache-first asset strategy (Vite hashes are immutable).
 *
 * @param {Request} request - The asset request.
 * @returns {Promise<Response>} The response to serve.
 */
async function assetResponse(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) {
    try {
      await store(cache, request, response.clone());
    } catch {
      // Best-effort — quota failures must not break the load.
    }
  }
  return response;
}
