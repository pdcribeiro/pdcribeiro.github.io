import { runningOn } from '/lib/infra/environment.js'

const FILE_PATH = '/service-worker.js'

export function registerServiceWorker() {
    if ('serviceWorker' in navigator && !runningOn.localhost()) {
        navigator.serviceWorker.register(FILE_PATH)
    }
}
