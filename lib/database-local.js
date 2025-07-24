import store from '/lib/store.js'

export function getCollection(key) {
    return {
        getAll,
        get: (id) => getAll().find(d => d.id === id),
        add: (data) => {
            const document = {
                ...data,
                id: makeId(),
                createdAt: makeTimestamp(),
            }
            updateAndSave(docs => [...docs, document])
        },
        update: (id, data) => {
            const updateDoc = (document) => ({
                ...document,
                ...data,
                updatedAt: makeTimestamp(),
            })
            updateAndSave(docs => docs.map(d => d.id === id ? updateDoc(d) : d))
        },
        remove: (id) => updateAndSave(docs => docs.filter(d => d.id !== id)),
    }

    function getAll() {
        return store.get(key) ?? []
    }

    function updateAndSave(callback) {
        const original = getAll()
        const updated = callback(original)
        store.set(key, updated)
    }
}

function makeId() {
    return Math.random().toString(36).slice(2)
}

function makeTimestamp() {
    return new Date().toISOString()
}
