export default class Note {
    constructor({ id = null, items = [], updateHistory = [], timeCreated }, { now }) {
        this.id = id
        this.items = items
        this.updateHistory = updateHistory
        this.timeCreated = timeCreated ?? now()
        this.now = now
    }
    get title() {
        return this.items[0]?.trim()
    }
    get timeUpdated() {
        return this.updateHistory.at(-1)?.timestamp
    }
    update(update) {
        const { timestamp, changes } = update
        if (this.timeUpdated && this.timeUpdated > timestamp) {
            throw new Error('update is old')
        }
        return new Note({
            ...this,
            items: changes.reduce((updated, c) => c.removed ? updated : [...updated, ...c.value], []),
            updateHistory: [...this.updateHistory, update], // TODO: keep only data necessary to compute items back and forth
        }, { now: this.now })
    }
}
