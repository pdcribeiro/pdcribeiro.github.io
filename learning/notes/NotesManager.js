import Note from './Note.js'

// TODO: select only necessary data (updateHistory can become large)
export default class NotesManager {
    constructor({ repo, now }) {
        this.repo = repo
        this.now = now
    }
    async listNotes() {
        return await this.repo.find()
    }
    async createNote() {
        const note = new Note({ items: [''] }, { now: this.now })
        return await this.repo.add(note)
    }
    async viewNote(id) {
        const noteData = await this.repo.get(id)
        return new Note(noteData, { now: this.now })
    }
    async updateNote(id, update) {
        console.debug('[NotesManager] updating note...', update)
        const noteData = await this.repo.get(id)
        const updated = new Note(noteData, { now: this.now })
            .update(update)
        await this.repo.set(id, updated)
        console.log('updated items', updated.items)
        return updated
    }
    async deleteNote(id) {
        return await this.repo.del(id)
    }
}
