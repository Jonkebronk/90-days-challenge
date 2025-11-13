// Service Worker for 90 Days Challenge PWA
const CACHE_NAME = '90-days-v3'
const urlsToCache = [
  '/',
  '/dashboard',
  '/login',
  '/apply',
  '/offline.html'
]

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        // Add URLs one by one to prevent failure on missing resources
        return Promise.all(
          urlsToCache.map(url =>
            cache.add(url).catch(err => {
              console.log('Failed to cache:', url, err)
              return Promise.resolve() // Don't fail the entire install
            })
          )
        )
      })
      .catch((err) => console.log('Cache install failed:', err))
  )
  // Force the waiting service worker to become active
  self.skipWaiting()
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip chrome extensions and non-http requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip caching for non-GET requests (POST, PUT, DELETE, etc.)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request))
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }

        return fetch(event.request).then(
          (response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone response for caching
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch(err => {
                  // Ignore cache put errors (e.g., for opaque responses)
                  console.log('Failed to cache:', event.request.url, err)
                })
              })
              .catch(err => {
                console.log('Failed to open cache:', err)
              })

            return response
          }
        ).catch(() => {
          // Return offline page if fetch fails
          return caches.match('/offline.html')
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
      // Take control of all clients immediately
      return self.clients.claim()
    })
  )
})
