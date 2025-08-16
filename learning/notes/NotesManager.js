import Note from './Note.js'

// TODO: select only necessary data (updateHistory can become large)
export default class NotesManager {
    constructor({ repo, now }) {
        this.repo = repo
        this.now = now
    }
    async listNotes() {
        const notesData = await this.repo.find()
        return notesData.map(n => this.#initNote(n))
    }
    async createNote() {
        const note = this.#initNote({ items: [''] })
        const noteData = await this.repo.add(note)
        return this.#initNote(noteData)
    }
    async viewNote(id) {
        const noteData = await this.repo.get(id)
        return this.#initNote(noteData)
    }
    async updateNote(id, update) {
        console.debug('[NotesManager] updating note...', update)
        const noteData = await this.repo.get(id)
        const updated = this.#initNote(noteData)
            .update(update)
        await this.repo.set(id, updated)
        return updated
    }
    async deleteNote(id) {
        return await this.repo.del(id)
    }
    #initNote(data) {
        return new Note(data, { now: this.now })
    }
}
