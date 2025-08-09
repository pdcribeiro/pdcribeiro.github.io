export function Note({ id = null, items = [], changes = [], timeCreated }, { now }) {
    return {
        id,
        items,
        changes,
        timeCreated: timeCreated ?? now(),
        get timeUpdated() {
            return this.changes.at(-1)?.timestamp
        },
        addItem(index, value) {
            const updated = this.update([{
                index,
                before: null,
                after: value,
                timestamp: now(),
            }])
            return updated
        },
        updateItem(index, value) {
            return this.update([{
                index,
                before: this.items[index],
                after: value,
                timestamp: now(),
            }])
        },
        removeItem(index) {
            return this.update([{
                index,
                before: this.items[index],
                after: null,
                timestamp: now(),
            }])
        },
        update(changes) {
            return updateNote(this, changes, { now })
        },
    }
}

function updateNote(note, changes, { now }) {
    if (changes.some((c, i) => i > 0 && c.timestamp < changes[i - 1].timestamp)) {
        throw new Error('changes are not sorted')
    }
    if (note.timeUpdated && note.timeUpdated > changes[0].timestamp) {
        throw new Error('changes are older')
    }
    return new Note({
        ...note,
        items: updateNoteItems(note.items, changes),
        changes: [...note.changes, ...changes],
    }, { now })
}

function updateNoteItems(items, changes) {
    return changes.reduce((updated, { index, before, after }) => {
        if (!before && !after) {
            throw new Error()
        }
        if (!before) {
            return [...updated.slice(0, index), after, ...updated.slice(index)]
        }
        if (!after) {
            return [...updated.slice(0, index), ...updated.slice(index + 1)]
        }
        return [...updated.slice(0, index), after, ...updated.slice(index + 1)]
    }, items)
}
