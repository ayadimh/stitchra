const CACHE_NAME = 'stitchra-pwa-v2';
const OFFLINE_URL = '/offline.html';
const SAFE_SHELL_PATHS = new Set([
  '/',
  '/en',
  '/de',
  '/fr',
  '/ar',
  '/es',
  '/ru',
]);
const PRIVATE_PREFIXES = [
  '/api',
  '/studio',
  '/order',
  '/pay',
  '/privacy',
  '/terms',
  '/impressum',
];
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/brand/exports/icons/favicon.svg',
  '/brand/exports/icons/favicon-16x16.png',
  '/brand/exports/icons/favicon-32x32.png',
  '/brand/exports/icons/apple-touch-icon.png',
  '/brand/exports/icons/icon-192.png',
  '/brand/exports/icons/icon-512.png',
  '/brand/exports/social/stitchra-og.png',
  '/brand/master/stitchra-thread-needle-icon.svg',
  '/brand/master/stitchra-horizontal.svg',
  '/mockups/shirts/shirt-front-white.png',
  '/mockups/shirts/shirt-back-white.png',
  '/mockups/shirts/shirt-front-black.png',
  '/mockups/shirts/shirt-back-black.png',
];

function isPrivatePath(pathname) {
  return PRIVATE_PREFIXES.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

function isCacheableStaticAsset(pathname) {
  return (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/brand/master/') ||
    pathname.startsWith('/brand/exports/') ||
    pathname.startsWith('/mockups/shirts/') ||
    pathname === '/icon.svg' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/stitchra-og.png' ||
    /^\/stitchra-[\w-]+\.(?:png|jpg|jpeg|svg)$/i.test(pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || isPrivatePath(url.pathname)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request, url.pathname));
    return;
  }

  if (isCacheableStaticAsset(url.pathname)) {
    event.respondWith(handleStaticAssetRequest(request));
  }
});

async function handleNavigationRequest(request, pathname) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response.ok && SAFE_SHELL_PATHS.has(pathname)) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    if (SAFE_SHELL_PATHS.has(pathname)) {
      const cachedShell = await cache.match(request);
      if (cachedShell) return cachedShell;
    }

    return cache.match(OFFLINE_URL);
  }
}

async function handleStaticAssetRequest(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);

  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }

  return response;
}
