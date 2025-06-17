const FILE_PATH = '/lib/service-worker/worker.js'
const SCOPE = '/'

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(FILE_PATH, { scope: SCOPE })
    }
}
