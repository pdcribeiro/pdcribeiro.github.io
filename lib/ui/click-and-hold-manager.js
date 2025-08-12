const CLICK_AND_HOLD_TIME_MS = 500

export function ClickAndHoldManager({ onHold, onHoldRelease }) {
    let timeout

    return {
        click: (e) => {
            timeout = setTimeout(() => {
                onHold(e)
                timeout = null
            }, CLICK_AND_HOLD_TIME_MS)
        },
        release: (e) => timeout ? clearTimeout(timeout) : onHoldRelease(e),
        abort: () => clearTimeout(timeout),
    }
}
