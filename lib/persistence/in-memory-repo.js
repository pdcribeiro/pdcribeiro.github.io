const uuid = () => crypto.randomUUID()

export default function InMemoryRepo() {
    const repo = new Map()

    return {
        find: async () => Array.from(repo.values()),
        add: async (document) => {
            const id = uuid()
            const docWithId = { ...document, id, }
            repo.set(id, docWithId)
            return docWithId
        },
        get: async (id) => {
            if (!repo.has(id)) throw new Error('Document not found', { id })
            return repo.get(id)
        },
        set: async (id, document) => {
            if (!repo.has(id)) throw new Error('Document not found', { id })
            repo.set(id, document)
            return document
        },
        del: async (id) => {
            if (!repo.has(id)) throw new Error('Document not found', { id })
            repo.delete(id)
        },
    }
}
