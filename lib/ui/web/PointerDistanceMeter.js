export default class PointerDistanceMeter {
    constructor() {
        this.origin = null
    }
    setOrigin(event) {
        this.origin = getPosition(event)
    }
    getDistance(event) {
        if (!this.origin) return

        const pos = getPosition(event)
        return Math.sqrt(
            Math.pow(pos.x - this.origin.x, 2) + Math.pow(pos.y - this.origin.y, 2)
        )
    }
}

function getPosition(event) {
    return {
        x: event.clientX ?? event.touches[0].clientX,
        y: event.clientY ?? event.touches[0].clientY,
    }
}
