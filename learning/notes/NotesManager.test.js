import InMemoryRepo from '../../lib/persistence/InMemoryRepo.js'
import { eq, test } from '../../lib/test/runner.js'
import NotesManager from './NotesManager.js'

const item = 'item'
const otherItem = 'other item'

test({
    'has no notes ': async () => {
        const manager = new TestManager()
        const notes = await manager.listNotes()
        eq(notes.length, 0)
    },
    'creates note': async () => {
        const manager = new TestManager()
        await manager.createNote()
        const notes = await manager.listNotes()
        eq(notes.length, 1)
    },
    'deletes note': async () => {
        const manager = new TestManager()
        const note = await manager.createNote()
        await manager.deleteNote(note.id)
        const notes = await manager.listNotes()
        eq(notes.length, 0)
    },
    'created note has one empty item': async () => {
        const manager = new TestManager()
        const note = await manager.createNote()
        const items = await manager.listItems(note.id)
        eq(items.length, 1)
        eq(items[0], '')
    },
    'adds item': async () => {
        const manager = new TestManager()
        const note = await manager.createNote()
        await manager.addItem(note.id, 0, item)
        const items = await manager.listItems(note.id)
        eq(items.length, 2)
        eq(items[0], item)
    },
    'updates item': async () => {
        const manager = new TestManager()
        const note = await manager.createNote()
        await manager.addItem(note.id, 0, item)
        await manager.updateItem(note.id, 0, otherItem)
        const items = await manager.listItems(note.id)
        eq(items.length, 2)
        eq(items[0], otherItem)
    },
    'removes item': async () => {
        const manager = new TestManager()
        const note = await manager.createNote()
        await manager.addItem(note.id, 0, item)
        await manager.removeItem(note.id, 0)
        const items = await manager.listItems(note.id)
        eq(items.length, 1)
    },
})

function TestManager() {
    return new NotesManager({
        repo: new InMemoryRepo(),
        now: Date.now,
    })
}
