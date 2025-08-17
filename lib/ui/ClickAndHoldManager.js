const CLICK_AND_HOLD_TIME_MS = 500

export default class ClickAndHoldManager {
    constructor({ onHold, onHoldRelease }) {
        this.onHold = onHold
        this.onHoldRelease = onHoldRelease

        this.timeout = null
        this.holding = false
    }
    click = (event) => {
        this.#checkClickIsValid()
        this.timeout = setTimeout(() => {
            this.timeout = null
            this.holding = true
            this.onHold(event)
        }, CLICK_AND_HOLD_TIME_MS)
    }
    release = (event) => {
        if (this.holding) {
            this.holding = false
            this.onHoldRelease(event)
        }
        this.abort()
    }
    abort = () => {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
        }
    }
    #checkClickIsValid() {
        if (this.timeout) {
            throw new Error('must release or abort before clicking again')
        }
        if (this.holding) {
            throw new Error('must release before clicking again')
        }
    }
}
