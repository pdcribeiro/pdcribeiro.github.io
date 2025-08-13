const uuid = () => crypto.randomUUID()

export default function LocalStorageRepo(key) {
    const findDoc = (id) => getDocs(key).find(d => d.id === id)
    const hasDoc = (id) => !!findDoc(id)
    const updateDocs = (callback) => setDocs(key, callback(getDocs(key)))

    return {
        find: async () => getDocs(key),
        add: async (document) => {
            const id = uuid()
            const docWithId = { ...document, id, }
            updateDocs(docs => [...docs, docWithId])
            return docWithId
        },
        get: async (id) => {
            const doc = findDoc(id)
            if (!doc) throw new Error('Document not found', { id })
            return doc
        },
        set: async (id, document) => {
            if (!hasDoc(id)) throw new Error('Document not found', { id })
            updateDocs(docs => docs.map(d => d.id === id ? document : d))
            return document
        },
        del: async (id) => {
            if (!hasDoc(id)) throw new Error('Document not found', { id })
            updateDocs(docs => docs.filter(d => d.id !== id))
        },
    }
}

function getDocs(key) {
    const json = localStorage.getItem(key)
    return JSON.parse(json) ?? []
}

function setDocs(key, value) {
    const json = JSON.stringify(value)
    localStorage.setItem(key, json)
}
