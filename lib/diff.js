export * from '/third-party/diff.js'

export class DiffChecker {
    #read

    constructor({ read, diff }) {
        this.#read = read
        this.diff = diff
        this.oldLines = null
    }
    read = () => {
        this.oldLines = this.#read()
    }
    run() {
        if (!this.oldLines) throw new Error('must read before running')

        const newLines = this.#read()
        const changes = this.diff(this.oldLines, newLines)
        this.oldLines = newLines
        return changes
    }
}
