import { ass, eq, fail, test } from '../../lib/test/runner.js'
import Note from './Note.js'

const firstItem = 'firstItem'
const secondItem = 'secondItem'
const timestamp = 1234567890123
const addTwoItemsUpdate = {
    changes: [
        { value: [firstItem, secondItem] },
    ],
    timestamp,
}
const removeSecondItemUpdate = {
    changes: [
        { value: [firstItem] },
        { value: [secondItem], removed: true }
    ],
    timestamp: timestamp + 1,
}
const oldUpdate = {
    ...removeSecondItemUpdate,
    timestamp: timestamp - 1,
}

const now = () => Date.now()

test({
    'created note has empty items': () => {
        const note = new Note({}, { now })
        eq(note.items.length, 0)
    },
    'created note has empty update history': () => {
        const note = new Note({}, { now })
        eq(note.updateHistory.length, 0)
    },
    'created note has timeCreated': () => {
        const note = new Note({}, { now })
        ass(note.timeCreated)
    },
    'created note does not have title': () => {
        const note = new Note({}, { now })
        ass(!note.title)
    },
    'created note does not have timeUpdated': () => {
        const note = new Note({}, { now })
        ass(!note.timeUpdated)
    },
    'adds items': () => {
        const note = new Note({}, { now })
            .update(addTwoItemsUpdate)
        eq(note.items.length, 2)
        eq(note.items[0], firstItem)
        eq(note.items[1], secondItem)
    },
    'removes item': () => {
        const note = new Note({}, { now })
            .update(removeSecondItemUpdate)
        eq(note.items.length, 1)
        eq(note.items[0], firstItem)
    },
    'updated note keeps original timeCreated': () => {
        const original = new Note({}, { now })
        const updated = original.update(addTwoItemsUpdate)
        eq(updated.timeCreated, original.timeCreated)
    },
    'updated note title is first item': () => {
        const note = new Note({}, { now })
            .update(addTwoItemsUpdate)
        eq(note.title, firstItem)
    },
    'updated note timeUpdated is last update timestamp': () => {
        const note = new Note({}, { now })
            .update(addTwoItemsUpdate)
            .update(removeSecondItemUpdate)
        eq(note.timeUpdated, removeSecondItemUpdate.timestamp)
    },
    'rejects old updates': () => {
        const note = new Note({}, { now })
            .update(addTwoItemsUpdate)
        fail(() => note.update(oldUpdate))
    },
})
