const CACHE_KEY = 'v1'

self.addEventListener('fetch', (event) => {
    event.respondWith(
        cacheFirst({
            request: event.request,
            fallbackUrl: '/fallback.html',
        }),
    )
})

async function cacheFirst({ request, fallbackUrl }) {
    const responseFromCache = await caches.match(request)
    if (responseFromCache) {
        return responseFromCache
    }

    try {
        const responseFromNetwork = await fetch(request)
        putInCache(request, responseFromNetwork.clone())
        return responseFromNetwork
    } catch (error) {
        const fallbackResponse = await caches.match(fallbackUrl)
        if (fallbackResponse) {
            return fallbackResponse
        }
        return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        })
    }
};

async function putInCache(request, response) {
    const cache = await caches.open(CACHE_KEY)
    await cache.put(request, response)
};
