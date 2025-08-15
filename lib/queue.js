export class AsyncQueue {
    constructor({ handler }) {
        this.handler = handler
        this.queue = []
        this.processing = false
    }
    push(item) {
        this.queue.push(item)
        this.#process()
    }
    async #process() {
        if (this.processing) return

        this.processing = true
        while (this.queue.length) {
            const item = this.queue.shift()
            await this.handler(item)
        }
        this.processing = false
    }
}
