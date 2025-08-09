import { ass, eq, test } from '../../lib/test/runner.js'
import { Note } from './note.js'

const item = 'item'
const otherItem = 'other item'

const now = () => {
    let time = 1
    return () => time++
}

test({
    'created note has empty items': () => {
        const note = new Note({}, { now })
        eq(note.items.length, 0)
    },
    'created note has empty changes': () => {
        const note = new Note({}, { now })
        eq(note.changes.length, 0)
    },
    'created note has timeCreated': () => {
        const note = new Note({}, { now })
        ass(note.timeCreated)
    },
    'created note does not have timeUpdated': () => {
        const note = new Note({}, { now })
        ass(!note.timeUpdated)
    },
    'updated note keeps original timeCreated': () => {
        const original = new Note({}, { now })
        const updated = original.addItem(0, item)
        eq(updated.timeCreated, original.timeCreated)
    },
    'updated note has timeUpdated': () => {
        const note = new Note({}, { now })
            .addItem(0, item)
        ass(note.timeUpdated)
    },
    'updated note has timeUpdated of last change': () => {
        const note = new Note({}, { now })
            .addItem(0, item)
        const lastChange = note.changes.at(-1)
        eq(note.timeUpdated, lastChange.timestamp)
    },
    'adds item': () => {
        const note = new Note({}, { now })
            .addItem(0, item)
        eq(note.items.length, 1)
        eq(note.items[0], item)
    },
    'updates item': () => {
        const note = new Note({}, { now })
            .addItem(0, item)
            .updateItem(0, otherItem)
        eq(note.items.length, 1)
        eq(note.items[0], otherItem)
    },
    'removes item': () => {
        const note = new Note({}, { now })
            .addItem(0, item)
            .removeItem(0)
        eq(note.items.length, 0)
    },
})
