export * from '/third-party/diff.js'

export class DiffChecker {
    constructor({ read, diff }) {
        this.read = read
        this.diff = diff
        this.oldLines = null
    }
    init = () => {
        this.oldLines = this.read()
    }
    run() {
        const newLines = this.read()
        const changes = this.diff(this.oldLines, newLines)
        this.oldLines = newLines
        return changes
    }
}
