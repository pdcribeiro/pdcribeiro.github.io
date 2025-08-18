const uuid = () => crypto.randomUUID()

/**
 * @implements {PersistenceRepo}
 */
export default class InMemoryRepo {
    constructor() {
        this.repo = new Map()
    }
    async init() { }
    async find() {
        return Array.from(this.repo.values())
    }
    async add(document) {
        const id = uuid()
        const docWithId = { ...document, id, }
        this.repo.set(id, docWithId)
        return docWithId
    }
    async get(id) {
        if (!this.repo.has(id)) throw new Error('Document not found')
        return this.repo.get(id)
    }
    async patch(id, patch) {
        if (!this.repo.has(id)) throw new Error('Document not found')
        const doc = this.repo.get(id)
        const patched = { ...doc, ...patch }
        this.repo.set(id, patched)
        return patched
    }
    async set(id, document) {
        if (!this.repo.has(id)) throw new Error('Document not found')
        this.repo.set(id, document)
        return document
    }
    async del(id) {
        if (!this.repo.has(id)) throw new Error('Document not found')
        this.repo.delete(id)
    }
}
