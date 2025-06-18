const CACHE_NAME = 'v1'

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(event.request)
            if (cached) {
                return cached
            }

            try {
                const response = await fetch(event.request)
                if (response.ok) {
                    cache.put(event.request, response.clone())
                }
                return response
            } catch {
                return new Response('Offline', { status: 503 })
            }
        })
    )
})
