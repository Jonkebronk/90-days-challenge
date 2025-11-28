// Service Worker for 90 Days Challenge PWA
const CACHE_NAME = '90-days-v6'
const urlsToCache = [
  '/offline.html'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err)
              return Promise.resolve()
            })
          )
        )
      })
      .catch((err) => console.log('Cache install failed:', err))
  )
  self.skipWaiting()
})

// Fetch event - network first, cache fallback for offline
self.addEventListener('fetch', (event) => {
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip service worker for API routes - let them pass through directly
  if (event.request.url.includes('/api/')) {
    return
  }

  // Skip caching for non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip caching for auth-related pages to avoid redirect issues
  if (event.request.url.includes('/login') ||
      event.request.url.includes('/auth') ||
      event.request.url.includes('/callback')) {
    return
  }

  // Network first strategy - only cache successful non-redirect responses
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful responses that are not redirects
        if (response && response.status === 200 && response.type === 'basic' && !response.redirected) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {})
            })
        }
        return response
      })
      .catch(() => {
        // Network failed - try cache, then offline page
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // For navigation requests, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html')
            }
            return new Response('Offline', { status: 503 })
          })
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})
