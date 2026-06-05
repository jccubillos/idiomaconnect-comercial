// IdiomaConnect — Service Worker
// Minimal offline shell: precaches the app skeleton + static assets,
// runtime-caches Supabase Storage avatars and API GET responses (where safe).

const VERSION = "v1";
const STATIC_CACHE = `ic-static-${VERSION}`;
const RUNTIME_CACHE = `ic-runtime-${VERSION}`;

// Precache the bare minimum so the offline page works even on first visit.
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin and Supabase Storage avatars
  const isSameOrigin = url.origin === self.location.origin;
  const isSupabaseAvatar = /\.supabase\.co\/storage\/v1\/object\/public\/avatars\//.test(url.href);

  if (!isSameOrigin && !isSupabaseAvatar) return;

  // Never cache POST/PUT/DELETE
  if (req.method !== "GET") return;

  // Skip auth/API mutation endpoints
  if (url.pathname.startsWith("/api/stripe") || url.pathname.startsWith("/auth/")) return;

  // Navigation requests: network-first → fallback offline shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(() =>
          caches.match(req).then(
            (m) => m || caches.match("/offline"),
          ),
        ),
    );
    return;
  }

  // Static assets, avatars, fonts: cache-first
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/avatars/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    isSupabaseAvatar
  ) {
    event.respondWith(
      caches.match(req).then((cached) =>
        cached
          ? cached
          : fetch(req).then((resp) => {
              const copy = resp.clone();
              caches.open(RUNTIME_CACHE).then((c) => c.put(req, copy));
              return resp;
            }),
      ),
    );
    return;
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
