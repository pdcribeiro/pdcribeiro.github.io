import Note from './Note.js'

export default function NotesManager({ repo, now }) {
    return {
        listNotes: async () => await repo.find(),
        createNote: async () => {
            const note = new Note({ items: [''] }, { now })
            return await repo.add(note)
        },
        deleteNote: async (id) => await repo.del(id),
        listItems: async (noteId) => {
            const noteData = await repo.get(noteId)
            return noteData.items
        },
        addItem: async (noteId, index, value) => {
            const noteData = await repo.get(noteId)
            const updated = new Note(noteData, { now })
                .addItem(index, value)
            await repo.set(noteId, updated)
            return updated
        },
        updateItem: async (noteId, index, value) => {
            const noteData = await repo.get(noteId)
            const updated = new Note(noteData, { now })
                .updateItem(index, value)
            await repo.set(noteId, updated)
            return updated
        },
        removeItem: async (noteId, index) => {
            const noteData = await repo.get(noteId)
            const updated = new Note(noteData, { now })
                .removeItem(index)
            await repo.set(noteId, updated)
            return updated
        },
    }
}
