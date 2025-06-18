const FILE_PATH = '/service-worker.js'

export function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register(FILE_PATH)
    }
}
