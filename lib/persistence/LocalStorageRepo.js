const uuid = () => crypto.randomUUID()

/**
 * @implements {PersistenceRepo}
 */
export default class LocalStorageRepo {
    /**
     * @param {{key: string}} config
     */
    constructor(config) {
        this.key = config.key
    }
    async init() { }
    async find() {
        return this.#getDocs()
    }
    async add(document) {
        const id = uuid()
        const docWithId = { ...document, id, }
        this.#updateDocs(docs => [...docs, docWithId])
        return docWithId
    }
    async get(id) {
        const doc = this.#findDoc(id)
        if (!doc) throw new Error('Document not found')
        return doc
    }
    async patch(id, patch) {
        const doc = this.#findDoc(id)
        if (!doc) throw new Error('Document not found')
        const patched = { ...doc, ...patch }
        this.#updateDocs(docs => docs.map(d => d.id === id ? patched : d))
        return patched
    }
    async set(id, document) {
        if (!this.#hasDoc(id)) throw new Error('Document not found')
        this.#updateDocs(docs => docs.map(d => d.id === id ? document : d))
        return document
    }
    async del(id) {
        if (!this.#hasDoc(id)) throw new Error('Document not found')
        this.#updateDocs(docs => docs.filter(d => d.id !== id))
    }
    #getDocs() {
        return getJson(this.key) ?? []
    }
    #findDoc(id) {
        return this.#getDocs().find(d => d.id === id)
    }
    #hasDoc(id) {
        return !!this.#findDoc(id)
    }
    #updateDocs(callback) {
        return setJson(this.key, callback(this.#getDocs()))
    }
}

export function getJson(key) {
    const json = localStorage.getItem(key)
    return JSON.parse(json)
}

export function setJson(key, value) {
    const json = JSON.stringify(value)
    localStorage.setItem(key, json)
}
