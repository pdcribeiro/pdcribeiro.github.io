const CLICK_AND_HOLD_TIME_MS = 500

export default class ClickAndHoldManager {
    constructor({ onClick, onHold, onHoldRelease, onAbort }) {
        this.onClick = onClick
        this.onHold = onHold
        this.onHoldRelease = onHoldRelease
        this.onAbort = onAbort

        this.timeout = null
        this.holding = false
    }
    click = (event) => {
        this.#checkClickIsValid()
        this.timeout = setTimeout(() => {
            this.timeout = null
            this.holding = true
            this.onHold?.(event)
        }, CLICK_AND_HOLD_TIME_MS)
        this.onClick?.(event)
    }
    release = (event) => {
        if (this.holding) {
            this.holding = false
            this.onHoldRelease?.(event)
        }
        this.abort(event)
    }
    abort = (event) => {
        if (this.timeout) {
            clearTimeout(this.timeout)
            this.timeout = null
            this.onAbort?.(event)
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
