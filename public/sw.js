// SIRIUS CRM — service worker for offline app-shell.
// Hand-written (no build-tool integration) to stay robust on Next 16 + Turbopack.
// - static assets: cache-first (populated as they are fetched online)
// - navigations: network-first, falling back to the last cached page / shell
// - API & cross-origin (Supabase): always network — offline writes are handled
//   in-app by the IndexedDB outbox, never by the service worker.

const VERSION = "v1";
const STATIC_CACHE = `sirius-static-${VERSION}`;
const PAGES_CACHE = `sirius-pages-${VERSION}`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Cross-origin (Supabase, fonts CDN…) and our own API routes: go to network.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(PAGES_CACHE);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cache = await caches.open(PAGES_CACHE);
          const cached =
            (await cache.match(request)) || (await cache.match("/dashboard"));
          if (cached) return cached;
          return new Response(
            "<!doctype html><meta charset='utf-8'><title>Hors-ligne</title>" +
              "<body style='font-family:sans-serif;background:#0F131F;color:#E5E7EB;" +
              "display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>" +
              "<div style='text-align:center'><h1>Hors-ligne</h1>" +
              "<p>Cette page n'a pas encore été consultée en ligne.</p></div>",
            {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            },
          );
        }
      })(),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const fresh = await fetch(request);
          if (fresh.ok) cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return cached || Response.error();
        }
      })(),
    );
  }
});
