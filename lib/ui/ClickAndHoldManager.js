const CLICK_AND_HOLD_TIME_MS = 500

export default class ClickAndHoldManager {
    constructor({ onHold, onHoldRelease }) {
        this.onHold = onHold
        this.onHoldRelease = onHoldRelease

        this.timeout = null
        this.holding = false
    }
    click(event) {
        this.timeout = setTimeout(() => {
            this.timeout = null
            this.holding = true
            this.onHold(event)
        }, CLICK_AND_HOLD_TIME_MS)
    }
    release(event) {
        if (timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
        if (this.holding) {
            this.holding = false
            this.onHoldRelease(event)
        }
    }
    abort() {
        clearTimeout(this.timeout)
    }
}
