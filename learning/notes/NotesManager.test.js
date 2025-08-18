import InMemoryRepo from '../../lib/persistence/InMemoryRepo.js'
import { eq, test } from '../../lib/test/runner.js'
import NotesManager from './NotesManager.js'

const firstItem = 'firstItem'
const secondItem = 'secondItem'
const addTwoItemsUpdate = {
    changes: [
        { value: [firstItem, secondItem] },
    ],
    timestamp: 1234567890123,
}

test({
    'has no notes ': async () => {
        const manager = createTestManager()
        const notes = await manager.listNotes()
        eq(notes.length, 0)
    },
    'creates note': async () => {
        const manager = createTestManager()
        await manager.createNote()
        const notes = await manager.listNotes()
        eq(notes.length, 1)
    },
    'created note has one empty item': async () => {
        const manager = createTestManager()
        const { id } = await manager.createNote()
        const { items } = await manager.viewNote(id)
        eq(items.length, 1)
        eq(items[0], '')
    },
    'deletes note': async () => {
        const manager = createTestManager()
        const { id } = await manager.createNote()
        await manager.deleteNote(id)
        const notes = await manager.listNotes()
        eq(notes.length, 0)
    },
    'updates note': async () => {
        const manager = createTestManager()
        const { id } = await manager.createNote()
        await manager.updateNote(id, addTwoItemsUpdate)
        const { items } = await manager.viewNote(id)
        eq(items.length, 2)
        eq(items[0], firstItem)
        eq(items[1], secondItem)
    },
})

function createTestManager() {
    return new NotesManager({
        repo: new InMemoryRepo(),
        now: Date.now,
    })
}
